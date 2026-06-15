import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TwoFactorService } from './two-factor.service';

@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private twoFactorService: TwoFactorService) {}

  /**
   * Generate a new 2FA secret and QR code URL
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async generate(@CurrentUser() user: any) {
    const { secret, otpauthUrl } = await this.twoFactorService.generateSecret(user.id);
    return {
      secret,
      otpauthUrl,
      message: 'Scan the QR code with your authenticator app, then verify with the code.',
    };
  }

  /**
   * Enable 2FA after verifying the initial code
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async enable(@CurrentUser() user: any, @Body('code') code: string) {
    // throw, don't return an error body
    if (!code || code.length !== 6) {
      throw new BadRequestException('Please provide a valid 6-digit code');
    }
    await this.twoFactorService.enable(user.id, code);
    return { message: 'Two-factor authentication enabled successfully' };
  }

  /**
   * Disable 2FA after verifying current code
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disable(@CurrentUser() user: any, @Body('code') code: string) {
    // throw, don't return an error body
    if (!code || code.length !== 6) {
      throw new BadRequestException('Please provide a valid 6-digit code');
    }
    await this.twoFactorService.disable(user.id, code);
    return { message: 'Two-factor authentication disabled successfully' };
  }

  /**
   * Verify 2FA code during login
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-login')
  @HttpCode(HttpStatus.OK)
  async verifyLogin(@Body() body: { email: string; code: string }) {
    // throw, don't return an error body
    if (!body.email || !body.code || body.code.length !== 6) {
      throw new BadRequestException('Please provide email and a valid 6-digit code');
    }
    const user = await this.twoFactorService.verifyLoginCode(body.email, body.code);
    return {
      verified: true,
      userId: user.id,
    };
  }

  /**
   * Check 2FA status for current user
   */
  @Post('status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getStatus(@CurrentUser() user: any) {
    const enabled = await this.twoFactorService.is2FAEnabled(user.id);
    return { enabled };
  }

  /**
   * Check if email requires 2FA (for login flow, before authentication)
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('check')
  @HttpCode(HttpStatus.OK)
  async check(@Body('email') email: string) {
    if (!email) {
      return { requires2FA: false };
    }
    const enabled = await this.twoFactorService.is2FAEnabledByEmail(email);
    return { requires2FA: enabled };
  }
}
