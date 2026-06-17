import { Controller, Get, Post, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as crypto from 'crypto';

@Controller('auth')
export class EmailVerificationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  // send to the logged in user
  @Post('send-verification-email')
  @UseGuards(JwtAuthGuard)
  async sendVerificationEmail(@CurrentUser() user: any) {
    return this.emailVerificationService.sendVerificationEmail(user.id);
  }

  // resend by address, unverified accounts only
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email address is required.');
    }

    const user = await this.userRepo.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      // don't reveal if email exists or not
      return { message: 'If an account with that email exists, a verification link has been sent.' };
    }

    if (user.email_verified) {
      return { message: 'Email is already verified. You can login.' };
    }

    try {
      await this.emailVerificationService.sendVerificationEmail(user.id);
      return { message: 'Verification email sent. Please check your inbox (and spam folder).' };
    } catch (error) {
      return { message: 'If an account with that email exists, a verification link has been sent.' };
    }
  }

  // link click from the email
  @Get('verify-email')
  async verifyEmailGet(@Query('token') token: string) {
    return this.verifyEmailToken(token);
  }

  // same thing over the api
  @Post('verify-email')
  async verifyEmailPost(@Body('token') token: string) {
    return this.verifyEmailToken(token);
  }

  /**
   * Shared verification logic
   */
  private async verifyEmailToken(token: string) {
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

  // is the current user verified
  @Get('verification-status')
  @UseGuards(JwtAuthGuard)
  async getVerificationStatus(@CurrentUser() user: any) {
    return this.emailVerificationService.getVerificationStatus(user.id);
  }
}
