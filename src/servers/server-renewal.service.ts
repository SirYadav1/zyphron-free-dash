import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Server } from '../entities/server.entity';
import { User } from '../entities/user.entity';
import { Setting } from '../entities/setting.entity';
import { Transaction } from '../entities/transaction.entity';
import { PterodactylService } from '../pterodactyl/pterodactyl.service';

@Injectable()
export class ServerRenewalService {
  private readonly logger = new Logger(ServerRenewalService.name);

  constructor(
    @InjectRepository(Server) private serverRepo: Repository<Server>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    private pterodactylService: PterodactylService,
  ) {}

  private async getSetting(key: string, defaultValue: string): Promise<string> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    return setting?.value || defaultValue;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiringServers() {
    this.logger.log('Checking for expiring servers...');

    const now = new Date();
    const warningDays = parseInt(await this.getSetting('renewal_warning_days', '2'));
    const warningCutoff = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);

    // Find active servers expiring within warning window
    const expiringSoon = await this.serverRepo.find({
      where: {
        expires_at: LessThan(warningCutoff.toISOString()),
        status: 'active',
      },
      relations: { user: true },
    });

    this.logger.log(`Found ${expiringSoon.length} servers expiring within ${warningDays} days`);

    // Log expiry warnings (could extend to email notifications)
    for (const server of expiringSoon) {
      const daysLeft = Math.max(0, Math.ceil(
        (new Date(server.expires_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ));
      this.logger.warn(
        `Server ${server.id} (${server.server_name}) expires in ${daysLeft} days. Renewal price: ${server.renewal_price} credits.`,
      );
    }

    return expiringSoon;
  }

  async suspendExpiredServers() {
    this.logger.log('Suspending expired servers...');

    const now = new Date();
    const expiredServers = await this.serverRepo.find({
      where: {
        expires_at: LessThan(now.toISOString()),
        status: 'active',
        is_suspended: 0 as any,
      },
    });

    let suspendedCount = 0;

    for (const server of expiredServers) {
      this.logger.log(`Server ${server.id} (${server.server_name}) has expired, suspending...`);

      if (server.pterodactyl_server_id) {
        try {
          await this.pterodactylService.suspendServer(server.pterodactyl_server_id);
        } catch (error) {
          this.logger.error(`Failed to suspend Pterodactyl server ${server.id}:`, error);
        }
      }

      await this.serverRepo.update(server.id, {
        is_suspended: 1,
        suspended_at: now.toISOString(),
        status: 'suspended',
      });

      suspendedCount++;
    }

    this.logger.log(`Suspended ${suspendedCount} expired servers`);
    return suspendedCount;
  }

  async renewServer(serverId: number, userId: string): Promise<{
    server: Server;
    message: string;
    newExpiresAt: string;
    remainingCoins: number;
    renewalDays: number;
    cost: number;
  }> {
    const server = await this.serverRepo.findOne({
      where: { id: serverId, user_id: userId },
    });

    if (!server) {
      throw new NotFoundException('Server not found or access denied');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const renewalDays = parseInt(await this.getSetting('server_validity_days', '7'));
    const renewalPrice = server.renewal_price || parseInt(await this.getSetting('renewal_price', '50'));

    if (user.coins < renewalPrice) {
      throw new BadRequestException(
        `Insufficient credits. Renewal costs ${renewalPrice} credits, you have ${user.coins}.`,
      );
    }

    // Calculate new expiry: if server is still active, extend from current expiry
    // If expired/suspended, extend from now
    let baseDate: Date;
    if (server.expires_at && new Date(server.expires_at) > new Date()) {
      baseDate = new Date(server.expires_at);
    } else {
      baseDate = new Date();
    }

    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setDate(newExpiryDate.getDate() + renewalDays);

    // Deduct credits with optimistic locking
    const updateResult = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ coins: user.coins - renewalPrice })
      .where('id = :id AND coins = :coins', { id: userId, coins: user.coins })
      .execute();

    if (updateResult.affected === 0) {
      throw new BadRequestException('Failed to deduct credits. Please try again.');
    }

    // Record transaction
    await this.transactionRepo.save(
      this.transactionRepo.create({
        user_id: userId,
        type: 'server_renewal',
        amount: -renewalPrice,
        description: `Renewed server ${server.server_name} for ${renewalDays} days`,
      }),
    );

    // Update server: set new expiry, unsuspend if needed
    const updateData: any = {
      expires_at: newExpiryDate.toISOString(),
    };

    if (server.is_suspended || server.status === 'suspended') {
      updateData.is_suspended = 0;
      updateData.suspended_at = null;
      updateData.status = 'active';

      // Try to unsuspend on Pterodactyl
      if (server.pterodactyl_server_id) {
        try {
          await this.pterodactylService.unsuspendServer(server.pterodactyl_server_id);
        } catch (error) {
          this.logger.error(`Failed to unsuspend Pterodactyl server ${server.id}:`, error);
        }
      }
    }

    await this.serverRepo.update(serverId, updateData);

    const updatedServer = await this.serverRepo.findOne({ where: { id: serverId } });

    this.logger.log(
      `Server ${serverId} renewed by user ${userId}. New expiry: ${newExpiryDate.toISOString()}. Cost: ${renewalPrice} credits.`,
    );

    return {
      server: updatedServer!,
      message: `Server renewed for ${renewalDays} days`,
      newExpiresAt: newExpiryDate.toISOString(),
      remainingCoins: (await this.userRepo.findOne({ where: { id: userId } }))?.coins ?? (user.coins - renewalPrice),  // BUG-M14 FIX: Re-fetch actual balance
      renewalDays,
      cost: renewalPrice,
    };
  }

  async getServerRenewalInfo(serverId: number, userId: string): Promise<{
    server: any;
    renewalPrice: number;
    renewalDays: number;
    userCoins: number;
    daysRemaining: number | null;
    isExpiringSoon: boolean;
    canRenew: boolean;
  }> {
    const server = await this.serverRepo.findOne({
      where: { id: serverId, user_id: userId },
    });

    if (!server) {
      throw new NotFoundException('Server not found or access denied');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const renewalDays = parseInt(await this.getSetting('server_validity_days', '7'));
    const renewalPrice = server.renewal_price || parseInt(await this.getSetting('renewal_price', '50'));
    const warningDays = parseInt(await this.getSetting('renewal_warning_days', '2'));

    const now = new Date();
    let daysRemaining: number | null = null;
    let isExpiringSoon = false;

    if (server.expires_at) {
      const expiryDate = new Date(server.expires_at);
      daysRemaining = Math.max(0, Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ));
      isExpiringSoon = daysRemaining <= warningDays;
    }

    const canRenew = user.coins >= renewalPrice;

    return {
      server: {
        id: server.id,
        serverName: server.server_name,
        status: server.status,
        isSuspended: !!server.is_suspended,
        expiresAt: server.expires_at,
      },
      renewalPrice,
      renewalDays,
      userCoins: user.coins,
      daysRemaining,
      isExpiringSoon,
      canRenew,
    };
  }

  async toggleAutoRenew(
    serverId: number,
    userId: string,
  ): Promise<{ serverId: number; autoRenew: boolean; message: string }> {
    const server = await this.serverRepo.findOne({
      where: { id: serverId, user_id: userId },
    });

    if (!server) {
      throw new NotFoundException('Server not found or access denied');
    }

    const newValue = server.auto_renew ? 0 : 1;
    await this.serverRepo.update(serverId, { auto_renew: newValue });

    this.logger.log(
      `Server ${serverId} auto-renew toggled to ${newValue ? 'ON' : 'OFF'} by user ${userId}`,
    );

    return {
      serverId,
      autoRenew: !!newValue,
      message: `Auto-renew ${newValue ? 'enabled' : 'disabled'} for server ${server.server_name}`,
    };
  }
}
