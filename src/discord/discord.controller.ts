import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Res,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DiscordService } from './discord.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

@Controller('discord')
export class DiscordController {
  constructor(
    private discordService: DiscordService,
    private jwtService: JwtService,
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
  ) {}

  @Get('link')
  async link(@Query('token') token: string, @Res() res: any) {
    if (!token) {
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }

    try {
      const payload = this.jwtService.verify(token);
      if (!payload || !payload.sub) throw new Error('Invalid token');

      const state = randomBytes(32).toString('hex');
      const { codeVerifier, codeChallenge } = this.discordService.generatePKCE();

      // store state in database (survives server restarts)
      await this.settingRepo.upsert({
        key: `oauth_state_${state}`,
        value: JSON.stringify({
          userId: payload.sub,
          codeVerifier,
          expiresAt: Date.now() + 10 * 60 * 1000,
        }),
      }, ['key']);

      // auto-cleanup old states (older than 10 min)
      await this.settingRepo.createQueryBuilder()
        .delete()
        .where("key LIKE 'oauth_state_%'")
        .andWhere(`value::json->>'expiresAt' < :now`, { now: Date.now().toString() })
        .execute();

      const url = this.discordService.getOAuthUrl(state, codeChallenge);
      return res.redirect(url);
    } catch {
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: any,
  ) {
    try {
      // read state from database
      const record = await this.settingRepo.findOne({ where: { key: `oauth_state_${state}` } });
      if (!record) {
        throw new Error('Invalid or expired OAuth state');
      }

      const stateData = JSON.parse(record.value);
      if (stateData.expiresAt < Date.now()) {
        await this.settingRepo.delete({ key: `oauth_state_${state}` });
        throw new Error('Invalid or expired OAuth state');
      }

      // one time use, drop it after reading
      await this.settingRepo.delete({ key: `oauth_state_${state}` });

      await this.discordService.handleCallback(code, stateData.userId, stateData.codeVerifier);
      return res.redirect(
        `${process.env.FRONTEND_URL}/settings?discord=linked`,
      );
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.FORBIDDEN
      ) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/settings?discord=not_in_guild`,
        );
      }
      return res.redirect(`${process.env.FRONTEND_URL}/settings?discord=error`);
    }
  }

  @Post('unlink')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async unlink(@CurrentUser() user: any) {
    await this.discordService.unlink(user.id);
    return {
      message: 'Discord account unlinked. Your servers have been suspended.',
    };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@CurrentUser() user: any) {
    return this.discordService.getStatus(user.id);
  }
}
