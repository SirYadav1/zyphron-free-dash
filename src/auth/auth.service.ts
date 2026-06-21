import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';
import { Setting } from '../entities/setting.entity';
import { AfkSession } from '../entities/afk-session.entity';
import { DailyLogin } from '../entities/daily-login.entity';
import { PasswordReset } from '../entities/password-reset.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PterodactylService } from '../pterodactyl/pterodactyl.service';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { MailService } from '../mail/mail.service';
import { EncryptionUtil } from '../common/utils/encryption.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // in-memory failed login tracker: { identifier: { count, lockedUntil } }
  private failedLogins = new Map<string, { count: number; lockedUntil: number }>();
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
    @InjectRepository(AfkSession)
    private afkSessionRepo: Repository<AfkSession>,
    @InjectRepository(DailyLogin)
    private dailyLoginRepo: Repository<DailyLogin>,
    @InjectRepository(PasswordReset)
    private passwordResetRepo: Repository<PasswordReset>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private pterodactylService: PterodactylService,
    private emailVerificationService: EmailVerificationService,
    private activityLogsService: ActivityLogsService,
    private mailService: MailService,
    private dataSource: DataSource,
  ) {}

  private checkAccountLockout(identifier: string): void {
    const record = this.failedLogins.get(identifier);
    if (record && record.lockedUntil > Date.now()) {
      const remainingSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
      throw new UnauthorizedException(`Account temporarily locked. Try again in ${remainingSeconds} seconds.`);
    }
    // clear lockout if expired
    if (record && record.lockedUntil <= Date.now()) {
      this.failedLogins.delete(identifier);
    }
  }

  private recordFailedLogin(identifier: string): void {
    const record = this.failedLogins.get(identifier) || { count: 0, lockedUntil: 0 };
    record.count++;
    if (record.count >= this.MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = Date.now() + this.LOCKOUT_DURATION_MS;
      this.logger.warn(`Account locked due to ${record.count} failed attempts: ${identifier}`);
    }
    this.failedLogins.set(identifier, record);
  }

  private clearFailedLogins(identifier: string): void {
    this.failedLogins.delete(identifier);
  }

  private async isUserAdmin(userId: string, is_admin: number): Promise<boolean> {
    if (is_admin) return true;
    const hasRole = await this.dataSource.query(
      'SELECT id FROM user_roles WHERE user_id = ? LIMIT 1',
      [userId],
    );
    return !!hasRole?.[0];
  }

  private async isMaintenanceMode(): Promise<boolean> {
    const setting = await this.settingRepo.findOne({ where: { key: 'maintenance_mode' } });
    return setting?.value === 'true';
  }

  async checkMaintenanceMode(): Promise<{ enabled: boolean }> {
    const enabled = await this.isMaintenanceMode();
    return { enabled };
  }

  async register(dto: RegisterDto, ipAddress?: string) {
    const existingEmail = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new BadRequestException('Email already registered. Please login.');
    }

    const existingUsername = await this.userRepo.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new BadRequestException('Username already taken.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      id: crypto.randomUUID(),
      username: dto.username,
      first_name: dto.first_name || null,
      last_name: dto.last_name || null,
      email: dto.email,
      password_hash: passwordHash,
      coins: 100,
      ip_address: ipAddress || null,
    });

    await this.userRepo.save(user);

    try {
      const pteroUser = await this.pterodactylService.createUser({
        username: dto.username,
        email: dto.email,
        password: dto.password,
      });
      const pteroId = pteroUser?.attributes?.id || pteroUser?.id;
      if (pteroId) {
        await this.userRepo.update(user.id, {
          pterodactyl_user_id: pteroId,
          pterodactyl_username: dto.username,
        });
        this.logger.log(`Auto-registered user ${user.id} on Pterodactyl (ID: ${pteroId})`);
      }
    } catch (err) {
      // creation failed, maybe the panel user already exists, try linking by email
      this.logger.warn(`Pterodactyl createUser failed, attempting email-link: ${err.message}`);
      try {
        const existingPteroUser = await this.pterodactylService.getUserByEmail(dto.email);
        if (existingPteroUser) {
          const pteroId = existingPteroUser.attributes?.id || existingPteroUser.id;
          await this.userRepo.update(user.id, {
            pterodactyl_user_id: pteroId,
            pterodactyl_username: existingPteroUser.attributes?.username || dto.username,
          });
          this.logger.log(`Linked existing Pterodactyl user ${pteroId} to new dashboard user ${user.id} (email match during registration)`);
        } else {
          this.logger.warn(`User ${user.email} not found on Pterodactyl either — will sync on first login`);
        }
      } catch (linkErr) {
        this.logger.warn(`Email-link failed during registration: ${linkErr.message}`);
      }
    }

    // send verification email
    try {
      const verificationService = this.emailVerificationService;
      if (verificationService) {
        await verificationService.sendVerificationEmail(user.id);
        this.logger.log(`Verification email sent to ${user.email}`);
      }
    } catch (emailErr) {
      this.logger.warn(`Failed to send verification email: ${emailErr.message}`);
      // don't fail registration if email sending fails
    }

    // log registration activity
    await this.activityLogsService.create({
      log_name: 'auth',
      description: `New user registered: ${dto.username} (${dto.email})`,
      subject_type: 'User',
      subject_id: 0,
      event: 'registered',
      causer_type: 'User',
      causer_id: user.id,
      properties: {
        email: dto.email,
        username: dto.username,
        ip_address: ipAddress || 'unknown',
      },
    }).catch(err => this.logger.warn(`Failed to log registration activity: ${err.message}`));

    const token = this.signToken(user.id);

    return {
      message: 'Registration successful. Please check your email for verification link.',
      userId: user.id,
    };
  }

  // links by email, creates the panel account if nothing matches
  private async syncPterodactylAccount(user: any): Promise<void> {
    if (user.pterodactyl_user_id) return; // Already linked

    try {
      // match by email first
      const existingPteroUser = await this.pterodactylService.getUserByEmail(user.email);
      if (existingPteroUser) {
        // exists on the panel, link it
        const pteroId = existingPteroUser.attributes?.id || existingPteroUser.id;
        await this.userRepo.update(user.id, {
          pterodactyl_user_id: pteroId,
          pterodactyl_username: existingPteroUser.attributes?.username || user.username,
        });
        this.logger.log(`Linked existing Pterodactyl user ${pteroId} to dashboard user ${user.id} (email match)`);
        return;
      }

      // nothing matched, create the panel account
      const pteroUser = await this.pterodactylService.createUser({
        username: user.username,
        email: user.email,
        password: crypto.randomBytes(16).toString('hex'), // random password, they log in here not on the panel
      });
      const pteroId = pteroUser?.attributes?.id || pteroUser?.id;
      if (pteroId) {
        await this.userRepo.update(user.id, {
          pterodactyl_user_id: pteroId,
          pterodactyl_username: user.username,
        });
        this.logger.log(`Created new Pterodactyl user ${pteroId} for dashboard user ${user.id}`);
      }
    } catch (err) {
      this.logger.warn(`Failed to sync Pterodactyl account for user ${user.id}: ${err.message}`);
    }
  }

  async login(dto: LoginDto) {
    const identifier = dto.email.trim().toLowerCase();
    this.checkAccountLockout(identifier);
    let user = await this.userRepo.findOne({ where: { email: identifier } });
    if (!user) {
      // try by username
      user = await this.userRepo.findOne({ where: { username: identifier } });
    }
    if (!user) {
      throw new UnauthorizedException('Invalid credentials. Please try again.');
    }
    if (!user.password_hash) {
      throw new UnauthorizedException('This account uses social login. Please sign in with Discord.');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!passwordValid) {
      this.recordFailedLogin(identifier);
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }

    this.clearFailedLogins(identifier);

    if (user.is_banned) {
      throw new UnauthorizedException('Your account has been banned');
    }

    // check maintenance mode - admins can still login
    const inMaintenance = await this.isMaintenanceMode();
    if (inMaintenance) {
      const userIsAdmin = await this.isUserAdmin(user.id, user.is_admin);
      if (!userIsAdmin) {
        throw new UnauthorizedException('System is under maintenance. Please try again later.');
      }
    }

    // check if email verification is required
    if (!user.email_verified) {
      return {
        requiresEmailVerification: true,
        email: user.email,
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
      };
    }

    // auto-sync Pterodactyl account if not linked yet
    if (!user.pterodactyl_user_id) {
      await this.syncPterodactylAccount(user);
      // re-fetch user to get updated pterodactyl_user_id
      const refreshed = await this.userRepo.findOne({ where: { email: dto.email } });
      if (refreshed) user = refreshed;
    }

    // update last_active timestamp
    await this.userRepo.update(user.id, { last_active: new Date().toISOString() });

    // log login activity
    await this.activityLogsService.create({
      log_name: 'auth',
      description: `User ${user.username || user.email} logged in`,
      subject_type: 'User',
      subject_id: 0,
      event: 'login',
      causer_type: 'User',
      causer_id: user.id,
      properties: {
        email: user.email,
        username: user.username,
      },
    }).catch(err => this.logger.warn(`Failed to log login activity: ${err.message}`));

    // check if 2FA is enabled - return requires2FA flag instead of token
    if (user.two_factor_enabled) {
      return {
        requires2FA: true,
        email: user.email,
        message: 'Please enter your two-factor authentication code',
      };
    }

    const dailyBonus = await this.awardDailyLoginBonus(user.id);

    // re-fetch user to get updated coin balance after daily bonus
    const updatedUser = await this.userRepo.findOne({ where: { id: user.id } });

    const token = this.signToken(user.id);
    const userIsAdmin = await this.isUserAdmin(user.id, user.is_admin);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        emailVerified: !!user.email_verified,
        isAdmin: userIsAdmin,
        coins: updatedUser?.coins ?? (user.coins + dailyBonus),
        profilePhoto: user.profile_photo,
        language: user.language || 'en',
        pterodactylUserId: user.pterodactyl_user_id,
        discordId: user.discord_id,
      },
      dailyBonus: dailyBonus > 0 ? dailyBonus : undefined,
    };
  }

  /**
   * Complete login with 2FA verification
   */
  async loginWith2FA(email: string, code: string) {
    const identifier = email.trim().toLowerCase();
    let user = await this.userRepo.findOne({ where: { email: identifier } });
    if (!user) {
      user = await this.userRepo.findOne({ where: { username: identifier } });
    }
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials. Please try again.');
    }

    if (!user.two_factor_enabled || !user.two_factor_secret) {
      throw new UnauthorizedException('Two-factor authentication is not enabled');
    }

    const OTPAuth = await import('otpauth');
    const totp = new OTPAuth.TOTP({
      issuer: 'Zyphron Cloud',
      label: user.email || user.username,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.two_factor_secret),
    });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

    if (user.is_banned) {
      throw new UnauthorizedException('Your account has been banned');
    }

    // check maintenance mode - admins can still login
    const inMaintenance2FA = await this.isMaintenanceMode();
    if (inMaintenance2FA) {
      const userIsAdmin2FA = await this.isUserAdmin(user.id, user.is_admin);
      if (!userIsAdmin2FA) {
        throw new UnauthorizedException('System is under maintenance. Please try again later.');
      }
    }

    // check if email verification is required
    if (!user.email_verified) {
      return {
        requiresEmailVerification: true,
        email: user.email,
        message: 'Please verify your email address before logging in.',
      };
    }

    const dailyBonus = await this.awardDailyLoginBonus(user.id);

    // re-fetch user to get updated coin balance after daily bonus
    const updatedUser2FA = await this.userRepo.findOne({ where: { id: user.id } });

    const token = this.signToken(user.id);
    const userIsAdmin2FA = await this.isUserAdmin(user.id, user.is_admin);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        emailVerified: !!user.email_verified,
        isAdmin: userIsAdmin2FA,
        coins: updatedUser2FA?.coins ?? (user.coins + dailyBonus),
        profilePhoto: user.profile_photo,
        language: user.language || 'en',
        pterodactylUserId: user.pterodactyl_user_id,
        discordId: user.discord_id,
      },
      dailyBonus: dailyBonus > 0 ? dailyBonus : undefined,
    };
  }

  async verifyEmail(token: string) {
    return { message: 'Email verification is not required for local accounts' };
  }

  async resendVerification(email: string) {
    return { message: 'Email verification is not required for local accounts' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userIsAdminProfile = await this.isUserAdmin(user.id, user.is_admin);

    return {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      emailVerified: !!user.email_verified,
      isAdmin: userIsAdminProfile,
      coins: user.coins,
      profilePhoto: user.profile_photo,
      language: user.language || 'en',
      pterodactylUserId: user.pterodactyl_user_id,
      pterodactylUsername: user.pterodactyl_username,
      discordId: user.discord_id,
      discordUsername: user.discord_username,
      createdAt: user.created_at,
    };
  }

  async updateProfile(userId: string, data: { username?: string; email?: string; first_name?: string; last_name?: string }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const updateData: any = {};

    if (data.username !== undefined && data.username.trim() && data.username !== user.username) {
      const existing = await this.userRepo.findOne({ where: { username: data.username } });
      if (existing) {
        throw new BadRequestException('Username already taken');
      }
      updateData.username = data.username;
    }

    if (data.email !== undefined && data.email.trim() && data.email !== user.email) {
      const existing = await this.userRepo.findOne({ where: { email: data.email } });
      if (existing) {
        throw new BadRequestException('Email already registered');
      }
      updateData.email = data.email;
    }

    if (data.first_name !== undefined) {
      updateData.first_name = data.first_name || null;
    }

    if (data.last_name !== undefined) {
      updateData.last_name = data.last_name || null;
    }

    if (Object.keys(updateData).length > 0) {
      await this.userRepo.update(userId, updateData);
    }

    return this.getProfile(userId);
  }

  async uploadProfilePhoto(userId: string, file: Express.Multer.File) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const photoUrl = `/uploads/profiles/${file.filename}`;
    await this.userRepo.update(userId, { profile_photo: photoUrl });

    return {
      message: 'Profile photo uploaded successfully',
      profilePhoto: photoUrl,
    };
  }

  async setupAdmin(
    setupKey: string,
    username: string,
    email: string,
    password: string,
  ) {
    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey) {
      throw new InternalServerErrorException(
        'ADMIN_KEY is not configured on the server',
      );
    }
    const setupKeyBuffer = Buffer.from(setupKey);
    const adminKeyBuffer = Buffer.from(adminKey);
    if (
      setupKeyBuffer.length !== adminKeyBuffer.length ||
      !crypto.timingSafeEqual(setupKeyBuffer, adminKeyBuffer)
    ) {
      throw new UnauthorizedException('Invalid setup key');
    }

    const existingAdmin = await this.userRepo.findOne({
      where: { is_admin: 1 },
    });
    if (existingAdmin) {
      throw new BadRequestException('Admin account already exists');
    }

    const existingEmail = await this.userRepo.findOne({ where: { email } });
    if (existingEmail) {
      throw new BadRequestException('Email already registered. Please login.');
    }

    const existingUsername = await this.userRepo.findOne({
      where: { username },
    });
    if (existingUsername) {
      throw new BadRequestException('Username already taken.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      id: crypto.randomUUID(),
      username,
      email,
      password_hash: passwordHash,
      is_admin: 1,
      coins: 100,
    });

    await this.userRepo.save(user);

    return {
      message: 'Admin account created successfully',
      userId: user.id,
      username: username,
    };
  }

  private signToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }

  private async awardDailyLoginBonus(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    const existingLogin = await this.dailyLoginRepo.findOne({
      where: { user_id: userId, login_date: today },
    });

    if (existingLogin) {
      return 0;
    }

    const setting = await this.settingRepo.findOne({
      where: { key: 'daily_login_bonus' },
    });
    const bonusAmount = setting ? parseInt(setting.value) || 25 : 25;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return 0;

    const newCoins = user.coins + bonusAmount;
    const updateResult = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ coins: newCoins })
      .where('id = :id AND coins = :currentCoins', {
        id: userId,
        currentCoins: user.coins,
      })
      .execute();

    if (updateResult.affected === 0) {
      this.logger.warn(
        `Daily bonus coin update failed for user ${userId}, possible race condition`,
      );
      return 0;
    }

    const dailyLogin = this.dailyLoginRepo.create({
      user_id: userId,
      login_date: today,
      coins_earned: bonusAmount,
    });

    try {
      await this.dailyLoginRepo.save(dailyLogin);
    } catch (err) {
      this.logger.warn(`Failed to record daily login for user ${userId}, rolling back coins`);
      await this.userRepo.update(userId, { coins: user.coins });
      return 0;
    }

    const transaction = this.transactionRepo.create({
      user_id: userId,
      type: 'daily_bonus',
      amount: bonusAmount,
      description: 'Daily login bonus',
    });
    await this.transactionRepo.save(transaction);

    this.logger.log(
      `Awarded daily login bonus of ${bonusAmount} coins to user ${userId}`,
    );
    return bonusAmount;
  }

  // forgot password - otp flow

  // 3 requests per 15 min per email
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      // always return success, don't leak whether the email exists
      return { message: 'If an account exists with this email, you will receive a reset code.' };
    }

    // check rate limit: max 3 resends per 15 minutes
    const recentResets = await this.passwordResetRepo.find({
      where: { email },
      order: { created_at: 'DESC' },
      take: 10,
    });

    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const recentCount = recentResets.filter(r => r.created_at > fifteenMinAgo).length;

    if (recentCount >= 3) {
      throw new BadRequestException('Too many reset requests. Please wait 15 minutes before trying again.');
    }

    // invalidate any existing unverified resets for this email
    for (const reset of recentResets) {
      if (!reset.verified) {
        reset.otp = 'invalidated';
        await this.passwordResetRepo.save(reset);
      }
    }

    // generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const encryptedOtp = EncryptionUtil.encrypt(otp);

    // expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const resetRecord = this.passwordResetRepo.create({
      email,
      otp: encryptedOtp,
      expires_at: expiresAt,
      attempts: 0,
      resend_count: recentCount + 1,
    });
    await this.passwordResetRepo.save(resetRecord);

    // send OTP email
    try {
      await this.mailService.sendEmail(
        email,
        'Password Reset Code — Zyphron Cloud',
        `<div style="margin:0;padding:0;background:#0a0f1a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:48px 40px 36px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);border-radius:16px 16px 0 0;text-align:center;">
          <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;margin:0 auto 16px;line-height:56px;font-size:28px;">🔑</div>
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">Password Reset</h1>
          <p style="margin:10px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Enter this code to reset your password</p>
        </td></tr>
        <tr><td style="padding:36px 40px;background:#0f1729;border-left:1px solid rgba(255,255,255,0.04);border-right:1px solid rgba(255,255,255,0.04);">
          <p style="margin:10px 0;font-size:15px;line-height:1.7;color:#94a3b8;">Hey <strong style="color:#e2e8f0;">${user.first_name || user.username}</strong>,</p>
          <p style="margin:10px 0;font-size:15px;line-height:1.7;color:#94a3b8;">We received a request to reset your password. Use the code below:</p>
          <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Your Reset Code</p>
            <p style="margin:0;font-size:42px;font-weight:800;color:#f59e0b;letter-spacing:8px;">${otp}</p>
          </div>
          <div style="background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:16px;margin:20px 0;">
            <p style="margin:0;font-size:13px;color:#ef4444;">⚠️ This code expires in <strong>10 minutes</strong>.</p>
            <p style="margin:8px 0 0;font-size:13px;color:#ef4444;">If you didn't request this, <strong>contact our support team immediately</strong> — your account may be at risk.</p>
          </div>
        </td></tr>
        <tr><td style="padding:24px 40px;background:#080c15;border-radius:0 0 16px 16px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;color:#4b5563;letter-spacing:0.5px;text-transform:uppercase;">Zyphron Cloud</p>
          <p style="margin:0;font-size:11px;color:#374151;">© 2026 Zyphron Cloud. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</div>`,
      );
      this.logger.log(`Password reset OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`);
    }

    return { message: 'If an account exists with this email, you will receive a reset code.' };
  }

  // checks the otp, hands back a short lived reset token
  async verifyResetOtp(email: string, otp: string): Promise<{ reset_token: string }> {
    const resetRecord = await this.passwordResetRepo.findOne({
      where: { email },
      order: { created_at: 'DESC' },
    });

    if (!resetRecord) {
      throw new BadRequestException('No reset request found. Please request a new code.');
    }

    if (resetRecord.verified) {
      throw new BadRequestException('This code has already been used. Please request a new code.');
    }

    if (resetRecord.otp === 'invalidated') {
      throw new BadRequestException('This code has been invalidated. Please request a new code.');
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      throw new BadRequestException('This code has expired. Please request a new code.');
    }

    if (resetRecord.attempts >= 5) {
      throw new BadRequestException('Too many failed attempts. Please request a new code.');
    }

    // increment attempts
    resetRecord.attempts += 1;
    await this.passwordResetRepo.save(resetRecord);

    // decrypt stored OTP and compare
    const storedOtp = EncryptionUtil.decrypt(resetRecord.otp);
    if (storedOtp !== otp) {
      throw new BadRequestException(`Invalid code. ${5 - resetRecord.attempts} attempts remaining.`);
    }

    // otp ok, mark verified and issue the reset token
    resetRecord.verified = true;
    const resetToken = crypto.randomBytes(32).toString('hex');
    resetRecord.reset_token = EncryptionUtil.encrypt(resetToken);
    await this.passwordResetRepo.save(resetRecord);

    return { reset_token: resetToken };
  }

  // sets the new password and sends the confirmation mail
  async resetPassword(email: string, resetToken: string, newPassword: string): Promise<{ message: string }> {
    const resetRecord = await this.passwordResetRepo.findOne({
      where: { email, verified: true },
      order: { created_at: 'DESC' },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired reset session. Please start over.');
    }

    if (!resetRecord.reset_token) {
      throw new BadRequestException('Invalid reset token. Please start over.');
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      throw new BadRequestException('Reset session expired. Please request a new code.');
    }

    // decrypt stored reset token and compare
    const storedToken = EncryptionUtil.decrypt(resetRecord.reset_token);
    if (storedToken !== resetToken) {
      throw new BadRequestException('Invalid reset token.');
    }

    // find user and update password
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(user.id, { password_hash: passwordHash });

    // invalidate the reset record
    resetRecord.reset_token = 'used';
    await this.passwordResetRepo.save(resetRecord);

    // send confirmation email with the new password
    try {
      await this.mailService.sendEmail(
        email,
        'Password Changed — Zyphron Cloud',
        `<div style="margin:0;padding:0;background:#0a0f1a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:48px 40px 36px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:16px 16px 0 0;text-align:center;">
          <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;margin:0 auto 16px;line-height:56px;font-size:28px;">✅</div>
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">Password Changed</h1>
          <p style="margin:10px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Your password has been updated successfully</p>
        </td></tr>
        <tr><td style="padding:36px 40px;background:#0f1729;border-left:1px solid rgba(255,255,255,0.04);border-right:1px solid rgba(255,255,255,0.04);">
          <p style="margin:10px 0;font-size:15px;line-height:1.7;color:#94a3b8;">Hey <strong style="color:#e2e8f0;">${user.first_name || user.username}</strong>,</p>
          <p style="margin:10px 0;font-size:15px;line-height:1.7;color:#94a3b8;">Your password has been changed successfully.</p>
          <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:20px;margin:20px 0;">
            <p style="margin:4px 0;font-size:13px;color:#94a3b8;">📧 Email: <strong style="color:#e2e8f0;">${email}</strong></p>
          </div>
          <div style="background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:16px;margin:20px 0;">
            <p style="margin:0;font-size:13px;color:#ef4444;">⚠️ <strong>If you did NOT request this password change, contact our support team immediately</strong> — your account may be compromised.</p>
          </div>
          <p style="margin:10px 0;font-size:13px;color:#64748b;">For security, we recommend changing this password to something only you know.</p>
        </td></tr>
        <tr><td style="padding:24px 40px;background:#080c15;border-radius:0 0 16px 16px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;color:#4b5563;letter-spacing:0.5px;text-transform:uppercase;">Zyphron Cloud</p>
          <p style="margin:0;font-size:11px;color:#374151;">© 2026 Zyphron Cloud. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</div>`,
      );
      this.logger.log(`Password changed confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password change email: ${error.message}`);
    }

    return { message: 'Password updated successfully. You can now log in with your new password.' };
  }
}
