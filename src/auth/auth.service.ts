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
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';
import { Setting } from '../entities/setting.entity';
import { AfkSession } from '../entities/afk-session.entity';
import { DailyLogin } from '../entities/daily-login.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PterodactylService } from '../pterodactyl/pterodactyl.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
    @InjectRepository(AfkSession)
    private afkSessionRepo: Repository<AfkSession>,
    @InjectRepository(DailyLogin)
    private dailyLoginRepo: Repository<DailyLogin>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private pterodactylService: PterodactylService,
  ) {}

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

    const token = this.signToken(user.id);

    return {
      message: 'Registration successful',
      access_token: token,
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
    let user = await this.userRepo.findOne({ where: { email: identifier } });
    if (!user) {
      // try by username
      user = await this.userRepo.findOne({ where: { username: identifier } });
    }
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.is_banned) {
      throw new UnauthorizedException('Your account has been banned');
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

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        emailVerified: true,
        isAdmin: !!user.is_admin,
        coins: updatedUser?.coins ?? (user.coins + dailyBonus),
        profilePhoto: user.profile_photo,
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
      throw new UnauthorizedException('Invalid credentials');
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

    const dailyBonus = await this.awardDailyLoginBonus(user.id);

    // re-fetch user to get updated coin balance after daily bonus
    const updatedUser2FA = await this.userRepo.findOne({ where: { id: user.id } });

    const token = this.signToken(user.id);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        emailVerified: true,
        isAdmin: !!user.is_admin,
        coins: updatedUser2FA?.coins ?? (user.coins + dailyBonus),
        profilePhoto: user.profile_photo,
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

    return {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      emailVerified: true,
      isAdmin: !!user.is_admin,
      coins: user.coins,
      profilePhoto: user.profile_photo,
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
}
