import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, LessThan, IsNull } from 'typeorm';
import { User } from '../entities/user.entity';
import { Server } from '../entities/server.entity';
import { Setting } from '../entities/setting.entity';
import { ServerTemplate } from '../entities/server-template.entity';
import { MailService } from '../mail/mail.service';
import { PterodactylService } from '../pterodactyl/pterodactyl.service';
import { ServerLifecycleService } from '../servers/server-lifecycle.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Server) private serverRepo: Repository<Server>,
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
    @InjectRepository(ServerTemplate)
    private templateRepo: Repository<ServerTemplate>,
    private mailService: MailService,
    private pterodactylService: PterodactylService,
    private serverLifecycleService: ServerLifecycleService,
  ) {}

  async getStats(): Promise<any> {
    const totalUsers = await this.userRepo.count();
    const totalServers = await this.serverRepo.count();
    const activeServers = await this.serverRepo.count({
      where: { status: 'active' },
    });
    const suspendedServers = await this.serverRepo.count({
      where: { status: 'suspended' },
    });
    const discordLinked = await this.userRepo.count({
      where: { discord_id: Not(IsNull()) },
    });

    return {
      totalUsers,
      totalServers,
      activeServers,
      suspendedServers,
      discordLinked,
    };
  }

  async getUsers(): Promise<any[]> {
    const users = await this.userRepo.find({ order: { created_at: 'DESC' } });
    const servers = await this.serverRepo.find({ select: { user_id: true } });

    const countMap = new Map<string, number>();
    servers.forEach((s) => {
      const uid = s.user_id;
      countMap.set(uid, (countMap.get(uid) || 0) + 1);
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      isBanned: user.is_banned,
      bannedAt: user.banned_at,
      banReason: user.ban_reason,
      discordId: user.discord_id,
      discordUsername: user.discord_username,
      pterodactylUserId: user.pterodactyl_user_id,
      coins: user.coins,
      ipAddress: user.ip_address,
      deviceFingerprint: user.device_fingerprint,
      isAdmin: user.is_admin,
      serverCount: countMap.get(user.id) || 0,
      createdAt: user.created_at,
    }));
  }

  async getUserDetail(id: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const servers = await this.serverRepo.find({
      where: { user_id: id },
      relations: { template: true },
      order: { created_at: 'DESC' },
    });

    // BUG-C2 FIX: Never spread full user entity — leaks password_hash, 2FA secret, IP, fingerprint
    return {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      isAdmin: user.is_admin,
      coins: user.coins,
      pterodactylUserId: user.pterodactyl_user_id,
      pterodactylUsername: user.pterodactyl_username,
      discordId: user.discord_id,
      discordUsername: user.discord_username,
      isBanned: user.is_banned,
      bannedAt: user.banned_at,
      banReason: user.ban_reason,
      createdAt: user.created_at,
      servers: servers.map((s) => {
        const now = new Date();
        const updated = s.last_active_at || s.updated_at || s.created_at;
        const inactiveDays = updated
          ? Math.floor(
              (now.getTime() - new Date(updated).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;
        const inactiveHours = updated
          ? Math.floor(
              (now.getTime() - new Date(updated).getTime()) / (1000 * 60 * 60),
            )
          : 0;
        return {
          id: s.id,
          serverName: s.server_name,
          pterodactylServerId: s.pterodactyl_server_id,
          status: s.status,
          ramMb: s.ram_mb,
          cpuPercent: s.cpu_percent,
          diskMb: s.disk_mb,
          expiresAt: s.expires_at,
          createdAt: s.created_at,
          inactiveHours,
          inactiveDays,
        };
      }),
    };
  }

  async updateUser(id: string, data: Partial<any>): Promise<any> {
    const allowedFields = ['username', 'email', 'first_name', 'last_name', 'coins', 'isAdmin'];
    const updateData: any = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'isAdmin') updateData['is_admin'] = data[field] ? 1 : 0;
        else if (field === 'coins') {
          const coins = Number(data[field]);
          if (isNaN(coins) || coins < 0) {
            throw new BadRequestException('Coins must be a non-negative number');
          }
          updateData[field] = coins;
        }
        else updateData[field] = data[field];
      }
    }

    const result = await this.userRepo.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User updated' };
  }

  async banUser(id: string, reason: string, adminId?: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.is_banned) throw new BadRequestException('User is already banned');
    if (user.is_admin) throw new BadRequestException('Cannot ban an admin user');
    if (adminId && id === adminId) throw new BadRequestException('You cannot ban yourself');

    await this.userRepo.update(id, {
      is_banned: 1,
      banned_at: new Date().toISOString(),
      ban_reason: reason || null,
    });

    await this.serverRepo.update(
      { user_id: id, status: 'active' },
      { status: 'suspended' },
    );

    try {
      if (user.email) {
        await this.mailService.sendBanNotification(user.email, reason);
      }
    } catch (error) {
      this.logger.warn('Failed to send ban notification email:', error);
    }

    return { message: 'User banned' };
  }

  async unbanUser(id: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.is_banned) throw new BadRequestException('User is not banned');

    await this.userRepo.update(id, {
      is_banned: 0,
      banned_at: null,
      ban_reason: null,
    });

    try {
      if (user.email) {
        await this.mailService.sendUnbanNotification(user.email);
      }
    } catch (error) {
      this.logger.warn('Failed to send unban notification email:', error);
    }

    return { message: 'User unbanned' };
  }

  async getServers(): Promise<any[]> {
    const servers = await this.serverRepo.find({
      relations: { user: true, template: true },
      order: { created_at: 'DESC' },
    });

    return servers.map((s) => ({
      id: s.id,
      serverName: s.server_name,
      pterodactylServerId: s.pterodactyl_server_id,
      status: s.status,
      ramMb: s.ram_mb,
      cpuPercent: s.cpu_percent,
      diskMb: s.disk_mb,
      expiresAt: s.expires_at,
      createdAt: s.created_at,
      user: s.user ? { id: s.user.id, username: s.user.username } : null,
      template: s.template
        ? { id: s.template.id, name: s.template.name }
        : null,
    }));
  }

  async suspendServer(id: number): Promise<any> {
    const server = await this.serverRepo.findOne({ where: { id } });
    if (!server) throw new NotFoundException('Server not found');

    if (server.pterodactyl_server_id) {
      try {
        await this.pterodactylService.suspendServer(
          server.pterodactyl_server_id,
        );
      } catch (error) {
        this.logger.error('Failed to suspend via Pterodactyl:', error);
      }
    }

    await this.serverRepo.update(id, { status: 'suspended' });
    return { message: 'Server suspended' };
  }

  async unsuspendServer(id: number): Promise<any> {
    const server = await this.serverRepo.findOne({ where: { id } });
    if (!server) throw new NotFoundException('Server not found');

    if (server.pterodactyl_server_id) {
      try {
        await this.pterodactylService.unsuspendServer(
          server.pterodactyl_server_id,
        );
      } catch (error) {
        this.logger.error('Failed to unsuspend via Pterodactyl:', error);
      }
    }

    await this.serverRepo.update(id, { status: 'active' });
    return { message: 'Server unsuspended' };
  }

  async getTemplates(): Promise<any[]> {
    const data = await this.templateRepo.find({
      order: { created_at: 'DESC' },
    });

    return data.map((tpl) => ({
      id: tpl.id,
      name: tpl.name,
      nodeId: tpl.node_id,
      eggId: tpl.egg_id,
      nestId: tpl.nest_id,
      ramMb: tpl.ram_mb,
      cpuPercent: tpl.cpu_percent,
      diskMb: tpl.disk_mb,
      databasesLimit: tpl.databases_limit,
      allocationsLimit: tpl.allocations_limit,
      backupLimit: tpl.backup_limit,
      dedicatedIp: tpl.dedicated_ip,
      dockerImage: tpl.docker_image,
      isActive: tpl.is_active,
      createdAt: tpl.created_at,
    }));
  }

  async createTemplate(data: any): Promise<any> {
    const template = this.templateRepo.create({
      name: data.name,
      node_id: data.nodeId,
      egg_id: data.eggId,
      nest_id: data.nestId,
      ram_mb: data.ramMb,
      cpu_percent: data.cpuPercent,
      disk_mb: data.diskMb,
      databases_limit: data.databasesLimit,
      allocations_limit: data.allocationsLimit,
      backup_limit: data.backupLimit,
      dedicated_ip: data.dedicatedIp,
      docker_image: data.dockerImage,
      is_active: data.isActive,
    });
    const saved = await this.templateRepo.save(template);
    return { message: 'Template created', template: saved };
  }

  async updateTemplate(id: number, data: any): Promise<any> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.nodeId !== undefined) updateData.node_id = data.nodeId;
    if (data.eggId !== undefined) updateData.egg_id = data.eggId;
    if (data.nestId !== undefined) updateData.nest_id = data.nestId;
    if (data.ramMb !== undefined) updateData.ram_mb = data.ramMb;
    if (data.cpuPercent !== undefined) updateData.cpu_percent = data.cpuPercent;
    if (data.diskMb !== undefined) updateData.disk_mb = data.diskMb;
    if (data.dockerImage !== undefined)
      updateData.docker_image = data.dockerImage;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.databasesLimit !== undefined)
      updateData.databases_limit = data.databasesLimit;
    if (data.allocationsLimit !== undefined)
      updateData.allocations_limit = data.allocationsLimit;
    if (data.backupLimit !== undefined)
      updateData.backup_limit = data.backupLimit;
    if (data.dedicatedIp !== undefined)
      updateData.dedicated_ip = data.dedicatedIp;

    const result = await this.templateRepo.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException('Template not found');
    }
    return { message: 'Template updated' };
  }

  async deleteTemplate(id: number): Promise<any> {
    const result = await this.templateRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Template not found');
    return { message: 'Template deleted' };
  }

  async getSettings(): Promise<Record<string, string>> {
    const settings = await this.settingRepo.find();
    const result: Record<string, string> = {};

    const defaults: Record<string, string> = {
      pterodactyl_panel_url:
        process.env.PTERODACTYL_PANEL_URL || 'https://panel.zyphron.cloud/',
      max_servers_total: '100',
      max_servers_per_user: '3',
      afk_coins_per_minute: '10',
      afk_time_interval_minutes: '1',
      server_validity_days: '7',
      renewal_coins: '50',
      ram_cost_per_mb: '2',
      cpu_cost_per_percent: '5',
      disk_cost_per_mb: '1',
      login_image_url: '',
      favicon_url: '',
    };

    const sensitiveKeys = ['pterodactyl_api_key', 'pterodactyl_client_key'];

    for (const [key, value] of Object.entries(defaults)) {
      result[key] = value;
    }

    if (settings) {
      for (const setting of settings) {
        if (!sensitiveKeys.includes(setting.key)) {
          result[setting.key] = setting.value;
        }
      }
    }

    return result;
  }

  async updateSetting(key: string, value: string): Promise<any> {
    const sensitiveKeys = ['pterodactyl_api_key', 'pterodactyl_client_key'];
    if (sensitiveKeys.includes(key)) {
      throw new BadRequestException('This setting cannot be modified via this endpoint');
    }

    const existing = await this.settingRepo.findOne({ where: { key } });
    if (existing) {
      await this.settingRepo.update(existing.id, { value });
    } else {
      await this.settingRepo.save(this.settingRepo.create({ key, value }));
    }

    return { message: `Setting "${key}" updated`, key, value };
  }

  async getPterodactylNodes(): Promise<any[]> {
    return this.pterodactylService.getNodes();
  }

  async getPterodactylNests(): Promise<any[]> {
    return this.pterodactylService.getNests();
  }

  async getPterodactylEggs(nestId: number): Promise<any[]> {
    return this.pterodactylService.getEggsByNest(nestId);
  }

  async getPterodactylConfig(): Promise<{
    panelUrl: string;
    configured: boolean;
  }> {
    return this.pterodactylService.getConfiguration();
  }

  async updatePterodactylConfig(
    panelUrl: string,
    apiKey: string,
    panelType?: string,
  ): Promise<any> {
    await this.pterodactylService.updateConfiguration(
      panelUrl,
      apiKey,
      panelType || 'pterodactyl',
    );
    return { message: 'Panel configuration updated successfully' };
  }

  async testPterodactylConfig(): Promise<any> {
    try {
      await this.pterodactylService.loadConfiguration();

      const nodes = await this.pterodactylService.getNodes();
      const config = await this.pterodactylService.getConfiguration();

      return {
        success: true,
        message: `${config.panelType.charAt(0).toUpperCase() + config.panelType.slice(1)} connection successful`,
        panelType: config.panelType,
        nodeCount: nodes.length,
      };
    } catch (error) {
      this.logger.error('Pterodactyl connection test failed:', error);

      let errorMessage = 'Panel connection failed';
      let guidance = '';

      if (
        error.message?.includes('Invalid token') ||
        error.message?.includes('401')
      ) {
        errorMessage = 'Invalid API Key';
        guidance =
          'Make sure you are using an Application API Key (starts with ptla_), not a Client API Key (ptlc_)';
      } else if (error.message?.includes('404')) {
        errorMessage = 'Panel URL Not Found';
        guidance = 'Check that your Panel URL is correct and accessible';
      } else if (
        error.message?.includes('ENOTFOUND') ||
        error.message?.includes('ECONNREFUSED')
      ) {
        errorMessage = 'Cannot Connect to Panel';
        guidance =
          'Check that the Panel URL is correct and the server is reachable';
      }

      return {
        success: false,
        message: errorMessage,
        // BUG-H8 FIX: Don't leak internal error details to client
        guidance,
      };
    }
  }

  async getExpiredServers(): Promise<any[]> {
    const now = new Date();
    const expiredServers = await this.serverRepo.find({
      where: {
        expires_at: LessThan(now.toISOString()),
        status: In(['active', 'suspended']),
      },
      relations: { user: true },
      order: { expires_at: 'ASC' },
    });

    return expiredServers.map((server) => ({
      id: server.id,
      serverName: server.server_name,
      pterodactylServerId: server.pterodactyl_server_id,
      status: server.status,
      expiresAt: server.expires_at,
      daysExpired: server.expires_at
        ? Math.floor(
            (now.getTime() - new Date(server.expires_at).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0,
      user: server.user
        ? {
            id: server.user.id,
            username: server.user.username,
          }
        : null,
    }));
  }

  async deleteServer(id: number): Promise<any> {
    await this.serverLifecycleService.manuallyDeleteServer(id);
    return { message: 'Server deleted successfully' };
  }

  async checkServerExpiry(id: number): Promise<any> {
    return this.serverLifecycleService.checkServerExpiry(id);
  }

  async checkExpiredServers(): Promise<any> {
    await this.serverLifecycleService.checkExpiredServers();
    return { message: 'Expired servers check completed' };
  }

  async getPterodactylUsers(): Promise<any> {
    return this.pterodactylService.listUsers();
  }

  async getPterodactylUserDetail(id: number): Promise<any> {
    return this.pterodactylService.getPterodactylUser(id);
  }

  async updatePterodactylUser(id: number, data: any): Promise<any> {
    return this.pterodactylService.updatePterodactylUser(id, data);
  }

  async getPterodactylLocations(): Promise<any[]> {
    return this.pterodactylService.getLocations();
  }

  async getPterodactylServerUtilization(id: string): Promise<any> {
    return this.pterodactylService.getServerUtilization(id);
  }

  async transferPterodactylServer(serverId: string, userId: number): Promise<any> {
    return this.pterodactylService.transferServer(serverId, userId);
  }

}
