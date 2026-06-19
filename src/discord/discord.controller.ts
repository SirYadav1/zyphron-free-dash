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

@Controller('discord')
export class DiscordController {
  constructor(
    private discordService: DiscordService,
    private jwtService: JwtService,
  ) {}

  @Get('link')
  async link(@Query('token') token: string, @Res() res: any) {
    if (!token) {
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }

    try {
      const payload = this.jwtService.verify(token);
      if (!payload || !payload.sub) throw new Error('Invalid token');

      const url = this.discordService.getOAuthUrl(token);
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
      const payload = this.jwtService.verify(state);
      if (!payload || !payload.sub) throw new Error('Invalid token in state');

      await this.discordService.handleCallback(code, payload.sub);
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
