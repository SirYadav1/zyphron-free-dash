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

// BUG-C1 FIX: Store OAuth states instead of leaking JWT in URL
// BUG-H7 FIX: Also store code_verifier for PKCE
const oauthStates = new Map<string, { userId: string; codeVerifier?: string; expiresAt: number }>();

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of oauthStates) {
    if (val.expiresAt < now) oauthStates.delete(key);
  }
}, 5 * 60 * 1000);

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

      // BUG-C1 FIX: Generate random state, store userId mapped to it
      // BUG-H7 FIX: Also generate and store PKCE code_verifier
      const state = randomBytes(32).toString('hex');
      const { codeVerifier, codeChallenge } = this.discordService.generatePKCE();
      oauthStates.set(state, {
        userId: payload.sub,
        codeVerifier,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 min expiry
      });

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
      // BUG-C1 FIX: Look up userId from state map instead of verifying JWT
      const stateData = oauthStates.get(state);
      if (!stateData || stateData.expiresAt < Date.now()) {
        throw new Error('Invalid or expired OAuth state');
      }
      oauthStates.delete(state); // One-time use

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
