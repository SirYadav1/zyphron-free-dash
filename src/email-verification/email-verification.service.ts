import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private readonly TOKEN_EXPIRY_HOURS = 24;
  private readonly MAX_EMAILS_PER_HOUR = 3;
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Generate a secure verification token
   */
  private generateToken(): string {
    return crypto.randomUUID();
  }

  // sha-256, bcrypt is too slow to look a token up by
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Check rate limit - max 3 emails per hour per user
   */
  private async checkRateLimit(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // check if user has a rate limit tracker
    // we use verification_expiry as a simple rate limit tracker — but it stores
    // the FUTURE expiry (sent + 24h), so subtract the token lifetime to get the
    // actual sent time. Previously the raw expiry was compared, locking resend
    // for the full 24h+ (bug fix).
    if (user.verification_expiry) {
      const lastSent =
        new Date(user.verification_expiry).getTime() -
        this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
      const now = new Date();
      const timeDiff = now.getTime() - lastSent;
      
      if (timeDiff < this.RATE_LIMIT_WINDOW_MS) {
        const remainingMinutes = Math.ceil((this.RATE_LIMIT_WINDOW_MS - timeDiff) / 60000);
        throw new BadRequestException(
          `Please wait ${remainingMinutes} minutes before requesting another verification email.`
        );
      }
    }
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (user.email_verified) {
      return { message: 'Email is already verified.' };
    }

    if (!user.email) {
      throw new BadRequestException('No email address associated with this account.');
    }

    // check rate limit
    await this.checkRateLimit(userId);

    // generate token
    const token = this.generateToken();
    const hashedToken = this.hashToken(token);

    // set expiry (24 hours from now)
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + this.TOKEN_EXPIRY_HOURS);

    // save to database
    await this.userRepo.update(userId, {
      verification_token: hashedToken,
      verification_expiry: expiry.toISOString(),
    });

    // send email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://108.181.193.242:8080'}/verify-email?token=${token}`;
    const brand = await this.mailService.getBrandName();
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #1a1a2e; color: #e0e0e0; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #16213e; border-radius: 12px; padding: 30px; border: 1px solid #0f3460; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #e94560; }
          .btn { display: inline-block; background: #e94560; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .btn:hover { background: #c73e54; }
          .note { background: #0f3460; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 14px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚡ ${brand}</div>
          </div>
          
          <h2 style="color: #e94560;">Verify Your Email</h2>
          
          <p>Hello <strong>${user.username || 'User'}</strong>,</p>
          
          <p>Thank you for registering with ${brand}! Please verify your email address to activate your account.</p>
          
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="btn">Verify Email Address</a>
          </p>
          
          <div class="note">
            <strong>📧 Can't find the email?</strong>
            <ul>
              <li>Check your <strong>Spam/Junk</strong> folder</li>
              <li>Check your <strong>Promotions</strong> tab (Gmail)</li>
              <li>Make sure ${user.email} is correct</li>
              <li>The email is sent from <strong>noreply@your-domain.com</strong></li>
            </ul>
          </div>
          
          <div class="note" style="background: #e9456020; border: 1px solid #e94560;">
            <strong>⏰ Important:</strong> This link expires in <strong>24 hours</strong>.
          </div>
          
          <div class="footer">
            <p>If you didn't create an account, please ignore this email.</p>
            <p>© ${new Date().getFullYear()} ${brand}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    try {
      await this.mailService.sendEmail(
        user.email,
        `Verify Your ${brand} Account`,
        htmlBody,
      );

      this.logger.log(`Verification email sent to ${user.email}`);
      return { message: 'Verification email sent. Please check your inbox (and spam folder).' };
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error.message}`);
      throw new BadRequestException('Failed to send verification email. Please try again later.');
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ message: string; userId: string }> {
    // hash the provided token
    const hashedToken = this.hashToken(token);

    // find user with this token
    const user = await this.userRepo.findOne({
      where: { verification_token: hashedToken },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token.');
    }

    // check if token expired
    if (user.verification_expiry) {
      const expiry = new Date(user.verification_expiry);
      if (expiry < new Date()) {
        throw new BadRequestException('Verification token has expired. Please request a new one.');
      }
    }

    // check if already verified
    if (user.email_verified) {
      return { message: 'Email is already verified.', userId: user.id };
    }

    // mark as verified
    await this.userRepo.update(user.id, {
      email_verified: 1,
      verification_token: null,
      verification_expiry: null,
    });

    this.logger.log(`Email verified for user ${user.id}`);
    return { message: 'Email verified successfully!', userId: user.id };
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(userId: string): Promise<{ verified: boolean; email: string | null }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    return {
      verified: !!user.email_verified,
      email: user.email,
    };
  }
}
