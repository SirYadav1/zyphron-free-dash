import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, Not, IsNull } from 'typeorm';
import { Server } from '../entities/server.entity';
import { User } from '../entities/user.entity';
import { PterodactylService } from '../pterodactyl/pterodactyl.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ServerLifecycleService {
  private readonly logger = new Logger(ServerLifecycleService.name);

  constructor(
    @InjectRepository(Server) private serverRepo: Repository<Server>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private pterodactylService: PterodactylService,
    private mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiredServers() {
    this.logger.log('Checking for expired servers...');

    const now = new Date();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const activeExpired = await this.serverRepo.find({
      where: {
        expires_at: LessThan(now.toISOString()),
        status: 'active',
      },
    });

    for (const server of activeExpired) {
      this.logger.log(`Server ${server.id} (${server.server_name}) has expired, suspending`);
      if (server.pterodactyl_server_id) {
        try {
          await this.pterodactylService.suspendServer(server.pterodactyl_server_id);
        } catch (error) {
          this.logger.error(`Failed to suspend expired server ${server.id}:`, error);
        }
      }
      await this.serverRepo.update(server.id, { status: 'expired' });

      // transfer ownership to admin so server disappears from original user's dashboard
      try {
        await this.transferServerToAdmin(server.id);
      } catch (error) {
        this.logger.error(`Failed to transfer expired server ${server.id} to admin:`, error);
      }
    }

    const expiredServers = await this.serverRepo.find({
      where: {
        expires_at: LessThan(cutoff24h.toISOString()),
        status: 'expired',
      },
      relations: { user: true },
    });

    if (!expiredServers || expiredServers.length === 0) {
      this.logger.log('No expired servers to delete');
      return;
    }

    this.logger.log(
      `Found ${expiredServers.length} expired servers (expired > 24h), processing deletion...`,
    );

    for (const server of expiredServers) {
      await this.deleteExpiredServer(server);
    }
  }

  private async deleteExpiredServer(server: any): Promise<void> {
    try {
      this.logger.log(
        `Processing expired server: ${server.server_name} (ID: ${server.id})`,
      );

      if (server.pterodactyl_server_id) {
        try {
          await this.pterodactylService.deleteServer(
            server.pterodactyl_server_id,
          );
          this.logger.log(
            `Deleted server from Pterodactyl: ${server.pterodactyl_server_id}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to delete server from Pterodactyl: ${server.pterodactyl_server_id}`,
            error,
          );
        }
      }

      await this.serverRepo.delete(server.id);

      try {
        const user = await this.userRepo.findOne({
          where: { id: server.user_id },
        });
        if (user?.email) {
          await this.mailService.sendServerDeletion(
            user.email,
            server.server_name,
            'Server expired due to credit expiry',
          );
        }
      } catch (error) {
        this.logger.error('Failed to send deletion email:', error);
      }

      this.logger.log(
        `Successfully deleted expired server: ${server.server_name} (ID: ${server.id})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process expired server: ${server.server_name} (ID: ${server.id})`,
        error,
      );
    }
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async cleanupOrphanedServers() {
    this.logger.log(
      'Checking for orphaned servers (deleted from Pterodactyl but not database)...',
    );

    const servers = await this.serverRepo.find({
      where: {
        pterodactyl_server_id: Not(IsNull()) as any,
        status: In(['active', 'suspended']),
      },
    });

    if (!servers || servers.length === 0) {
      return;
    }

    let cleanedCount = 0;

    for (const server of servers) {
      try {
        await this.pterodactylService.getServer(server.pterodactyl_server_id!);
      } catch (error) {
        this.logger.log(
          `Cleaning up orphaned server: ${server.server_name} (ID: ${server.id})`,
        );

        await this.serverRepo.delete(server.id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} orphaned servers`);
    }
  }

  async checkServerExpiry(
    serverId: number,
  ): Promise<{ isExpired: boolean; expiresAt: string | null }> {
    const server = await this.serverRepo.findOne({
      where: { id: serverId },
      select: { expires_at: true },
    });

    if (!server) {
      throw new Error('Server not found');
    }

    const isExpired = server.expires_at
      ? new Date(server.expires_at) < new Date()
      : false;

    return {
      isExpired,
      expiresAt: server.expires_at,
    };
  }

  async transferServerToAdmin(serverId: number): Promise<void> {
    const server = await this.serverRepo.findOne({ where: { id: serverId } });
    if (!server) {
      throw new Error('Server not found');
    }

    const adminUser = await this.userRepo.findOne({ where: { is_admin: 1 } });
    if (!adminUser) {
      this.logger.warn('No admin user found to transfer server ownership');
      return;
    }

    const previousOwner = server.user_id;
    await this.serverRepo.update(serverId, { user_id: adminUser.id });
    this.logger.log(
      `Transferred server ${serverId} (${server.server_name}) from user ${previousOwner} to admin ${adminUser.id}`,
    );
  }

  async manuallyDeleteServer(serverId: number): Promise<void> {
    const server = await this.serverRepo.findOne({ where: { id: serverId } });

    if (!server) {
      throw new Error('Server not found');
    }

    await this.deleteExpiredServer(server);
  }
}
