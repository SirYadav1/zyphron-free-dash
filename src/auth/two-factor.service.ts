import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as OTPAuth from 'otpauth';
import { User } from '../entities/user.entity';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  /**
   * Create a TOTP instance for a user
   */
  private createTOTP(user: User, secret?: string): OTPAuth.TOTP {
    return new OTPAuth.TOTP({
      issuer: 'Zyphron Cloud',
      label: user.email || user.username,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret ? OTPAuth.Secret.fromBase32(secret) : undefined,
    });
  }

  /**
   * Generate a new TOTP secret for a user
   */
  async generateSecret(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.two_factor_enabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    const totp = this.createTOTP(user);
    const secret = totp.secret.base32;
    const otpauthUrl = totp.toString();

    // Save the secret temporarily (not enabled yet)
    await this.userRepo.update(userId, { two_factor_secret: secret });

    return { secret, otpauthUrl };
  }

  /**
   * Verify a TOTP code against the user's secret
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.two_factor_secret) {
      throw new BadRequestException('Two-factor authentication is not set up');
    }

    const totp = this.createTOTP(user, user.two_factor_secret);
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  }

  /**
   * Enable 2FA after verifying the initial code
   */
  async enable(userId: string, code: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.two_factor_secret) {
      throw new BadRequestException('Please generate a secret first');
    }

    if (user.two_factor_enabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    const totp = this.createTOTP(user, user.two_factor_secret);
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.userRepo.update(userId, { two_factor_enabled: 1 });
    this.logger.log(`2FA enabled for user ${userId}`);
  }

  /**
   * Disable 2FA after verifying current code
   */
  async disable(userId: string, code: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.two_factor_enabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    if (!user.two_factor_secret) {
      throw new BadRequestException('Two-factor authentication is not set up');
    }

    const totp = this.createTOTP(user, user.two_factor_secret);
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.userRepo.update(userId, {
      two_factor_enabled: 0,
      two_factor_secret: null,
    });
    this.logger.log(`2FA disabled for user ${userId}`);
  }

  /**
   * Verify 2FA code during login
   */
  async verifyLoginCode(email: string, code: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.two_factor_enabled || !user.two_factor_secret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    const totp = this.createTOTP(user, user.two_factor_secret);
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

    return user;
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return false;
    return user.two_factor_enabled === 1;
  }

  /**
   * Check if email has 2FA enabled (for login flow)
   */
  async is2FAEnabledByEmail(email: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) return false;
    return user.two_factor_enabled === 1;
  }
}
