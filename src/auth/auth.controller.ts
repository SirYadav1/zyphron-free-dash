import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  Ip,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as crypto from 'crypto';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SetupAdminDto } from './dto/setup-admin.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Ip() ip: string) {
    return this.authService.register(dto, ip);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('maintenance')
  async checkMaintenance() {
    return this.authService.checkMaintenanceMode();
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('login-2fa')
  async loginWith2FA(@Body() body: { email: string; code: string }) {
    return this.authService.loginWith2FA(body.email, body.code);
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

  @Post('profile/photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: '/var/www/html/uploads/profiles',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const filename = `${crypto.randomUUID()}${ext}`;
          cb(null, filename);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadProfilePhoto(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.authService.uploadProfilePhoto(user.id, file);
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

  // forgot password - otp flow

  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 per 15 min
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.authService.forgotPassword(email.trim().toLowerCase());
  }

  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 per 5 min
  @Post('verify-reset-otp')
  async verifyResetOtp(@Body() body: { email: string; otp: string }) {
    if (!body.email || !body.otp) throw new BadRequestException('Email and OTP are required');
    return this.authService.verifyResetOtp(body.email.trim().toLowerCase(), body.otp.trim());
  }

  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 per 5 min
  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; reset_token: string; new_password: string }) {
    if (!body.email || !body.reset_token || !body.new_password) {
      throw new BadRequestException('Email, reset token, and new password are required');
    }
    if (body.new_password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    return this.authService.resetPassword(
      body.email.trim().toLowerCase(),
      body.reset_token,
      body.new_password,
    );
  }
}
