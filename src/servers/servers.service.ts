import { Injectable, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';
import { User } from '../entities/user.entity';
import { Setting } from '../entities/setting.entity';
import { Transaction } from '../entities/transaction.entity';
import { Product } from '../entities/product.entity';
import { PterodactylService } from '../pterodactyl/pterodactyl.service';
import * as crypto from 'crypto';

@Injectable()
export class ServersService {
  private readonly logger = new Logger(ServersService.name);

  constructor(
    @InjectRepository(Server) private readonly serverRepo: Repository<Server>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private pterodactylService: PterodactylService,
  ) {}

  private async getSetting(key: string, defaultValue: string): Promise<string> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    return setting?.value || defaultValue;
  }

  async getBlueprint(): Promise<any> {
    return {
      nodeId: parseInt(await this.getSetting('default_node_id', '6')),
      eggId: parseInt(await this.getSetting('default_egg_id', '2')),
      nestId: parseInt(await this.getSetting('default_nest_id', '1')),
      ramMb: parseInt(await this.getSetting('default_ram_mb', '2048')),
      cpuPercent: parseInt(await this.getSetting('default_cpu_percent', '100')),
      diskMb: parseInt(await this.getSetting('default_disk_mb', '5120')),
      databasesLimit: parseInt(
        await this.getSetting('default_databases_limit', '0'),
      ),
      allocationsLimit: parseInt(
        await this.getSetting('default_allocations_limit', '1'),
      ),
      backupLimit: parseInt(await this.getSetting('default_backup_limit', '0')),
      dedicatedIp:
        (await this.getSetting('default_dedicated_ip', 'false')) === 'true',
      dockerImage: await this.getSetting(
        'default_docker_image',
        'ghcr.io/pterodactyl/yolks:java_25',
      ),
    };
  }

  /**
   * Fetch available server plans from products table.
   * Only returns enabled products.
   */
  async getPlans(): Promise<any[]> {
    const products = await this.productRepo.find({
      where: { disabled: 0 },
      order: { sort_order: 'ASC', coin_price: 'ASC' },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      coin_price: product.coin_price,
      duration_days: product.duration_days,
      ram: product.ram,
      cpu: product.cpu,
      disk: product.disk,
      egg_name: product.egg_name,
      nest_name: product.nest_name,
    }));
  }

  async getNests(): Promise<any[]> {
    try {
      return await this.pterodactylService.getNests();
    } catch (error) {
      this.logger.warn('Failed to fetch nests:', error.message);
      return [];
    }
  }

  async getEggsByNest(nestId: number): Promise<any[]> {
    try {
      return await this.pterodactylService.getEggsByNest(nestId);
    } catch (error) {
      this.logger.warn(`Failed to fetch eggs for nest ${nestId}:`, error.message);
      return [];
    }
  }


  async getUserServers(userId: string): Promise<any[]> {
    const data = await this.serverRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    const user = await this.userRepo.findOne({ where: { id: userId } });
    let pteroServers: any[] = [];
    if (user && user.pterodactyl_user_id) {
      try {
        pteroServers = await this.pterodactylService.getUserServers(
          user.pterodactyl_user_id,
        );
      } catch (error) {
        this.logger.warn(`Failed to fetch Pterodactyl servers for user ${userId}:`, error);
      }
    }

    const pteroServerMap = new Map(
      (pteroServers || []).map((s: any) => [
        s.attributes.id.toString(),
        s.attributes,
      ]),
    );

    return data.map((server) => {
      const pteroData = server.pterodactyl_server_id
        ? pteroServerMap.get(server.pterodactyl_server_id)
        : null;
      return {
        id: server.id,
        serverName: server.server_name,
        pterodactylServerId: server.pterodactyl_server_id,
        identifier: pteroData?.identifier || null,
        node: pteroData?.node || null,
        status: server.status,
        ramMb: server.ram_mb,
        cpuPercent: server.cpu_percent,
        diskMb: server.disk_mb,
        expiresAt: server.expires_at,
        renewalPrice: server.renewal_price,
        isSuspended: !!server.is_suspended,
        suspendedAt: server.suspended_at,
        autoRenew: !!server.auto_renew,
        createdAt: server.created_at,
      };
    });
  }

  async getServerById(id: number, userId?: string): Promise<any> {
    const where: any = { id };
    if (userId) where.user_id = userId;

    const server = await this.serverRepo.findOne({
      where,
      relations: { user: true },
    });
    if (!server) throw new NotFoundException('Server not found');
    return server;
  }

  async getAllServers(): Promise<any[]> {
    const servers = await this.serverRepo.find({
      relations: { user: true },
      order: { created_at: 'DESC' },
    });
    return servers;
  }

  async createServer(userId: string, serverName: string, productId?: number, overrideNestId?: number, overrideEggId?: number): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.is_banned) throw new ForbiddenException('Your account is banned');

    if (!user.discord_id || user.discord_left_at) {
      throw new ForbiddenException(
        'You must link your Discord account and join our server to deploy nodes.',
      );
    }

    if (!user.pterodactyl_user_id) {
      // Try to auto-link or create Pterodactyl account before failing
      this.logger.log(`User ${user.id} has no Pterodactyl link — attempting auto-sync...`);
      try {
        // Step 1: Find existing Pterodactyl user by email
        let existingPteroUser: any = null;
        if (user.email) {
          existingPteroUser = await this.pterodactylService.getUserByEmail(user.email);
        }
        // Step 1b: If not found by email, try by username
        if (!existingPteroUser && user.username) {
          existingPteroUser = await this.pterodactylService.getUserByUsername(user.username);
        }

        if (existingPteroUser) {
          const pteroId = existingPteroUser.attributes?.id || existingPteroUser.id;
          await this.userRepo.update(user.id, {
            pterodactyl_user_id: pteroId,
            pterodactyl_username: existingPteroUser.attributes?.username || user.username,
          });
          user.pterodactyl_user_id = pteroId;
          this.logger.log(`Auto-linked Pterodactyl user ${pteroId} to dashboard user ${user.id}`);
        } else {
          // Step 2: Not found — create new Pterodactyl account
          const pteroUser = await this.pterodactylService.createUser({
            username: (user.username || 'user') as string,
            email: (user.email || '') as string,
            password: crypto.randomBytes(16).toString('hex'),
          });
          const pteroId = pteroUser?.attributes?.id || pteroUser?.id;
          if (pteroId) {
            await this.userRepo.update(user.id, {
              pterodactyl_user_id: pteroId,
              pterodactyl_username: user.username,
            });
            user.pterodactyl_user_id = pteroId;
            this.logger.log(`Created new Pterodactyl user ${pteroId} for dashboard user ${user.id}`);
          }
        }
      } catch (syncErr) {
        this.logger.warn(`Auto-sync Pterodactyl failed: ${syncErr.message}`);
      }
    }

    if (!user.pterodactyl_user_id) {
      throw new BadRequestException(
        'No Pterodactyl account linked. Please contact support.',
      );
    }

    // Resolve plan specs from Product entity
    let ramMb: number;
    let cpuPercent: number;
    let diskMb: number;
    let costCoins: number;
    let durationDays: number;
    let productDisplay: string = 'Default Blueprint';
    let nestId: number;
    let eggId: number;

    if (productId) {
      // Fetch product from products table
      const product = await this.productRepo.findOne({ where: { id: productId } });
      if (!product) throw new NotFoundException('Product not found');
      if (product.disabled) throw new BadRequestException('This product is currently unavailable');
      const productNestId = product.nest_id;
      const productEggId = product.egg_id;
      if (!productNestId || !productEggId) {
        throw new BadRequestException('Product is not properly configured. Please contact support.');
      }

      ramMb = product.ram || 2048;
      cpuPercent = product.cpu || 100;
      diskMb = product.disk || 10240;
      costCoins = product.coin_price || 100;
      durationDays = product.duration_days || 7;
      productDisplay = product.name || `Product #${product.id}`;
      nestId = overrideNestId || productNestId;
      eggId = overrideEggId || productEggId;
    } else {
      // Fallback to blueprint from settings (backward compatibility)
      const blueprint = await this.getBlueprint();
      ramMb = blueprint.ramMb;
      cpuPercent = blueprint.cpuPercent;
      diskMb = blueprint.diskMb;
      costCoins = 100; // Legacy default cost
      durationDays = parseInt(await this.getSetting('server_validity_days', '7'));
      nestId = blueprint.nestId;
      eggId = blueprint.eggId;
    }

    // Check coins
    if (user.coins < costCoins) {
      throw new BadRequestException(
        `Insufficient coins to create a server. You need ${costCoins} coins but have ${user.coins}.`,
      );
    }

    // Check server limits
    const maxPerUser = parseInt(
      await this.getSetting('max_servers_per_user', '3'),
    );
    const maxTotal = parseInt(
      await this.getSetting('max_servers_total', '100'),
    );

    const userActiveCount = await this.serverRepo.count({
      where: { user_id: userId, status: 'active' },
    });
    if (userActiveCount >= maxPerUser) {
      throw new BadRequestException(
        `You have reached the maximum of ${maxPerUser} servers.`,
      );
    }

    const totalActiveCount = await this.serverRepo.count({
      where: { status: 'active' },
    });
    if (totalActiveCount >= maxTotal) {
      throw new BadRequestException(
        'The server limit has been reached. Please try again later.',
      );
    }

    // Read Pterodactyl node ID from settings
    const nodeId = parseInt(await this.getSetting('default_node_id', '6'));

    // Read additional blueprint settings for Pterodactyl
    const databasesLimit = parseInt(await this.getSetting('default_databases_limit', '0'));
    const allocationsLimit = parseInt(await this.getSetting('default_allocations_limit', '1'));
    const backupLimit = parseInt(await this.getSetting('default_backup_limit', '0'));
    const dedicatedIp = (await this.getSetting('default_dedicated_ip', 'false')) === 'true';
    const dockerImage = await this.getSetting(
      'default_docker_image',
      'ghcr.io/pterodactyl/yolks:minecraft',
    );

    // Calculate validity using product's duration_days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    // Auto-append "-free-dash" suffix to server name
    const finalServerName = `${serverName}-free-dash`;

    // Create Pterodactyl server
    let pterodactylServerId: string | null = null;
    try {
      const pteroServer = await this.pterodactylService.createServer({
        name: finalServerName,
        userId: user.pterodactyl_user_id,
        nodeId,
        eggId,
        nestId,
        ram: ramMb,
        cpu: cpuPercent,
        disk: diskMb,
        databasesLimit,
        allocationsLimit,
        backupLimit,
        dedicatedIp,
        dockerImage,
      });

      pterodactylServerId = pteroServer.attributes?.id?.toString() || null;
    } catch (error) {
      const errorMsg = error?.response?.data || error?.message || error;
      this.logger.error(
        `Failed to create Pterodactyl server for user ${userId}: ${JSON.stringify(errorMsg)}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        `Failed to provision server: ${error?.message || 'Unknown panel error'}`,
      );
    }

    // Deduct coins
    const updateResult = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ coins: user.coins - costCoins })
      .where('id = :id AND coins = :coins', { id: userId, coins: user.coins })
      .execute();

    if (updateResult.affected === 0) {
      if (pterodactylServerId) {
        try {
          await this.pterodactylService.deleteServer(pterodactylServerId);
          this.logger.log(
            `Rolled back Pterodactyl server ${pterodactylServerId} after coin deduction failure`,
          );
        } catch (cleanupError) {
          this.logger.error(
            `Failed to cleanup Pterodactyl server ${pterodactylServerId}:`,
            cleanupError,
          );
        }
      }
      throw new BadRequestException(
        'Failed to deduct coins. Please try again.',
      );
    }

    // Record transaction
    await this.transactionRepo.save(
      this.transactionRepo.create({
        user_id: userId,
        type: 'server_create',
        amount: -costCoins,
        description: `Created server ${finalServerName} (${productDisplay})`,
      }),
    );

    // Read renewal price setting
    const renewalPriceSetting = parseInt(
      await this.getSetting('renewal_price', '50'),
    );

    // Save server record
    const server = this.serverRepo.create({
      user_id: userId,
      template_id: null,
      server_name: finalServerName,
      pterodactyl_server_id: pterodactylServerId,
      ram_mb: ramMb,
      cpu_percent: cpuPercent,
      disk_mb: diskMb,
      status: 'active',
      expires_at: expiryDate.toISOString(),
      renewal_price: renewalPriceSetting,
    });

    try {
      const savedServer = await this.serverRepo.save(server);
      return {
        id: savedServer.id,
        serverName: savedServer.server_name,
        pterodactylServerId: savedServer.pterodactyl_server_id,
        status: savedServer.status,
        ramMb: savedServer.ram_mb,
        cpuPercent: savedServer.cpu_percent,
        diskMb: savedServer.disk_mb,
        expiresAt: savedServer.expires_at,
        createdAt: savedServer.created_at,
      };
    } catch (error) {
      this.logger.error('Failed to insert server record:', error);
      if (pterodactylServerId) {
        try {
          await this.pterodactylService.deleteServer(pterodactylServerId);
          this.logger.log(
            `Rolled back Pterodactyl server ${pterodactylServerId} after DB insert failure`,
          );
        } catch (cleanupError) {
          this.logger.error(
            `Failed to cleanup Pterodactyl server ${pterodactylServerId}:`,
            cleanupError,
          );
        }
      }
      // Re-read fresh coin balance before rollback to avoid race condition
      const freshUserForRollback = await this.userRepo.findOne({ where: { id: userId } });
      if (freshUserForRollback) {
        const rollbackCoins = freshUserForRollback.coins + costCoins;
        await this.userRepo
          .createQueryBuilder()
          .update(User)
          .set({ coins: rollbackCoins })
          .where('id = :id AND coins = :currentCoins', { id: userId, currentCoins: freshUserForRollback.coins })
          .execute();
        this.logger.log(`Rolled back ${costCoins} coins for user ${userId} (now ${rollbackCoins})`);
      }
      throw new InternalServerErrorException(
        'Failed to create server record. Please try again.',
      );
    }
  }

  async suspendServer(serverId: number): Promise<any> {
    const server = await this.getServerById(serverId);
    if (server.pterodactyl_server_id) {
      try {
        await this.pterodactylService.suspendServer(
          server.pterodactyl_server_id,
        );
      } catch (error) {
        this.logger.error('Failed to suspend Pterodactyl server:', error);
      }
    }
    await this.serverRepo.update(serverId, { status: 'suspended' });
    return this.serverRepo.findOne({ where: { id: serverId } });
  }

  async unsuspendServer(serverId: number): Promise<any> {
    const server = await this.getServerById(serverId);
    if (server.pterodactyl_server_id) {
      try {
        await this.pterodactylService.unsuspendServer(
          server.pterodactyl_server_id,
        );
      } catch (error) {
        this.logger.error('Failed to unsuspend Pterodactyl server:', error);
      }
    }
    await this.serverRepo.update(serverId, { status: 'active' });
    return this.serverRepo.findOne({ where: { id: serverId } });
  }

  async deleteServer(serverId: number, userId?: string): Promise<void> {
    const server = await this.getServerById(serverId, userId);
    if (server.pterodactyl_server_id) {
      try {
        await this.pterodactylService.deleteServer(
          server.pterodactyl_server_id,
        );
      } catch (error) {
        this.logger.error('Failed to delete Pterodactyl server:', error);
      }
    }
    await this.serverRepo.delete(serverId);
  }

  async updateServer(serverId: number, userId: string, data: { serverName?: string }): Promise<any> {
    const server = await this.serverRepo.findOne({
      where: { id: serverId, user_id: userId },
    });
    if (!server) throw new NotFoundException('Server not found');

    const updateData: any = {};
    if (data.serverName) updateData.server_name = data.serverName;

    if (Object.keys(updateData).length > 0) {
      await this.serverRepo.update(serverId, updateData);
    }

    return this.getServerById(serverId, userId);
  }

  async getActiveServersCountByUser(userId: string): Promise<number> {
    return this.serverRepo.count({
      where: { user_id: userId, status: 'active' },
    });
  }

  async getUserServerStats(userId: string): Promise<{
    active: number;
    suspended: number;
    expired: number;
    total: number;
    globalUptime: number;
    ramUsageGb: number;
    avgCpu: number;
    regions: number;
    panelUrl?: string;
  }> {
    const active = await this.serverRepo.count({
      where: { user_id: userId, status: 'active' },
    });
    const suspended = await this.serverRepo.count({
      where: { user_id: userId, status: 'suspended' },
    });
    const expired = await this.serverRepo.count({
      where: { user_id: userId, status: 'expired' },
    });

    const activeServers = await this.serverRepo.find({
      where: { user_id: userId, status: 'active' },
    });
    const ramUsageGb =
      activeServers.reduce((acc, s) => acc + (s.ram_mb || 0), 0) / 1024;
    const avgCpu =
      activeServers.length > 0
        ? activeServers.reduce((acc, s) => acc + (s.cpu_percent || 0), 0) /
          activeServers.length
        : 0;

    return {
      active,
      suspended,
      expired,
      total: active + suspended + expired,
      globalUptime: 99.99,
      ramUsageGb: Number(ramUsageGb.toFixed(1)),
      avgCpu: Math.round(avgCpu),
      regions: 1,
      panelUrl: process.env.PTERODACTYL_PANEL_URL,
    };
  }

  async getTotalActiveServersCount(): Promise<number> {
    return this.serverRepo.count({ where: { status: 'active' } });
  }
}
