import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class EmailVerificationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  /**
   * Send verification email to current user
   * POST /api/auth/send-verification-email
   */
  @Post('send-verification-email')
  @UseGuards(JwtAuthGuard)
  async sendVerificationEmail(@CurrentUser() user: any) {
    return this.emailVerificationService.sendVerificationEmail(user.id);
  }

  /**
   * Verify email with token (from email link)
   * GET /api/auth/verify-email?token=xxx
   */
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      return { message: 'Invalid verification link.', success: false };
    }
    
    try {
      const result = await this.emailVerificationService.verifyEmail(token);
      return { ...result, success: true };
    } catch (error) {
      return { message: error.message, success: false };
    }
  }

  /**
   * Get verification status for current user
   * GET /api/auth/verification-status
   */
  @Get('verification-status')
  @UseGuards(JwtAuthGuard)
  async getVerificationStatus(@CurrentUser() user: any) {
    return this.emailVerificationService.getVerificationStatus(user.id);
  }
}
