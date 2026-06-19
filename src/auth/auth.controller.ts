import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { SetupAdminDto } from './dto/setup-admin.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Ip() ip: string) {
    return this.authService.register(dto, ip);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('login-2fa')
  async loginWith2FA(@Body() body: { email: string; code: string }) {
    return this.authService.loginWith2FA(body.email, body.code);
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('resend-verification')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() body: { username?: string; email?: string; first_name?: string; last_name?: string },
  ) {
    return this.authService.updateProfile(user.id, body);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('setup-admin')
  async setupAdmin(@Body() dto: SetupAdminDto) {
    return this.authService.setupAdmin(
      dto.setupKey,
      dto.username,
      dto.email,
      dto.password,
    );
  }
}
