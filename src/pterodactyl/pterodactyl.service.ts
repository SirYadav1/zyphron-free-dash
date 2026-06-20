import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

interface PterodactylUserResponse {
  id: number;
  attributes?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface CreateUserInput {
  username: string;
  email: string;
  password: string;
}

interface CreateServerInput {
  name: string;
  userId: number;
  nodeId: number;
  eggId: number;
  nestId: number;
  ram: number;
  cpu: number;
  disk: number;
  databasesLimit: number;
  allocationsLimit: number;
  backupLimit: number;
  dedicatedIp: boolean;
  dockerImage?: string;
}

@Injectable()
export class PterodactylService {
  private readonly logger = new Logger(PterodactylService.name);
  private panelUrl: string;
  private apiKey: string;
  private panelType: string = 'pterodactyl';
  private configLoaded = false;
  private lastConfigLoad = 0;
  private readonly CONFIG_CACHE_TTL = 30000;

  constructor(
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
  ) {
    this.panelUrl = process.env.PTERODACTYL_PANEL_URL || '';
    this.apiKey = process.env.PTERODACTYL_API_KEY || '';
  }

  async loadConfiguration(): Promise<void> {
    const now = Date.now();
    if (this.configLoaded && now - this.lastConfigLoad < this.CONFIG_CACHE_TTL) {
      return;
    }
    try {
      const panelTypeData = await this.settingRepo.findOne({
        where: { key: 'panel_type' },
      });
      const panelUrlData = await this.settingRepo.findOne({
        where: { key: 'pterodactyl_panel_url' },
      });
      const apiKeyData = await this.settingRepo.findOne({
        where: { key: 'pterodactyl_api_key' },
      });

      this.panelType = panelTypeData?.value || 'pterodactyl';
      this.panelUrl =
        panelUrlData?.value || process.env.PTERODACTYL_PANEL_URL || '';
      this.apiKey = apiKeyData?.value || process.env.PTERODACTYL_API_KEY || '';

      this.configLoaded = true;
      this.lastConfigLoad = Date.now();
      this.logger.log(`Panel configuration loaded: ${this.panelType}`);
    } catch (error) {
      this.logger.error(
        'Failed to load panel configuration from settings, using environment variables',
        error,
      );
      this.panelType = 'pterodactyl';
      this.panelUrl = process.env.PTERODACTYL_PANEL_URL || '';
      this.apiKey = process.env.PTERODACTYL_API_KEY || '';
    }
  }

  async updateConfiguration(
    panelUrl: string,
    apiKey?: string,
    panelType: string = 'pterodactyl',
  ): Promise<void> {
    const upsertSetting = async (key: string, value: string) => {
      const existing = await this.settingRepo.findOne({ where: { key } });
      if (existing) {
        await this.settingRepo.update(existing.id, { value });
      } else {
        await this.settingRepo.save(this.settingRepo.create({ key, value }));
      }
    };

    await upsertSetting('pterodactyl_panel_url', panelUrl);
    // Only update apiKey if a new one was provided (non-empty)
    if (apiKey) {
      await upsertSetting('pterodactyl_api_key', apiKey);
    }
    await upsertSetting('panel_type', panelType);

    await this.loadConfiguration();
    this.configLoaded = false;
    this.lastConfigLoad = 0;
    this.logger.log(`Panel configuration updated: ${panelType}`);
  }

  async getConfiguration(): Promise<{
    panelType: string;
    panelUrl: string;
    configured: boolean;
    apiKeyConfigured: boolean;
  }> {
    await this.loadConfiguration();
    return {
      panelType: this.panelType,
      panelUrl: this.panelUrl,
      configured: !!(this.panelUrl && this.apiKey),
      apiKeyConfigured: !!this.apiKey,
    };
  }

  private async getHeaders(): Promise<Record<string, string>> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.pterodactyl.v1+json',
    };
  }

  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any,
  ): Promise<T> {
    await this.loadConfiguration();
    const baseUrl = this.panelUrl.endsWith('/')
      ? this.panelUrl.slice(0, -1)
      : this.panelUrl;
    const url = `${baseUrl}/api/application${endpoint}`;

    const options: RequestInit = {
      method,
      headers: await this.getHeaders(),
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (error) {
      throw new HttpException(
        `Failed to connect to panel: ${error.message || 'Network error'}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new HttpException(
        `Pterodactyl API error: ${response.statusText} - ${errorText}`,
        response.status,
      );
    }

    if (response.status === 204) {
      return null as any;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : (null as any);
  }

  async createUser(input: CreateUserInput): Promise<PterodactylUserResponse> {
    const data = await this.request<any>('/users', 'POST', {
      username: input.username,
      email: input.email,
      first_name: input.username,
      last_name: 'User',
      password: input.password,
    });

    return data;
  }

  async getUser(userId: number): Promise<PterodactylUserResponse> {
    return this.request<any>(`/users/${userId}`);
  }

  async getUserServers(userId: number): Promise<any[]> {
    try {
      const res = await this.request<any>(`/users/${userId}?include=servers`);
      const servers =
        res?.relationships?.servers?.data ||
        res?.attributes?.relationships?.servers?.data;
      if (servers?.length) {
        return servers;
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  async getUserByEmail(email: string): Promise<any> {
    const data = await this.request<any>(
      `/users?filter[email]=${encodeURIComponent(email)}`,
    );
    if (data && data.data && data.data.length > 0) {
      return data.data[0];
    }
    return null;
  }

  async getUserByUsername(username: string): Promise<any> {
    const data = await this.request<any>(
      `/users?filter[username]=${encodeURIComponent(username)}`,
    );
    if (data && data.data && data.data.length > 0) {
      return data.data[0];
    }
    return null;
  }

  async deleteUser(userId: number): Promise<void> {
    await this.request(`/users/${userId}`, 'DELETE');
  }

  async getFreeAllocation(nodeId: number): Promise<number> {
    const res = await this.request<any>(
      `/nodes/${nodeId}/allocations?per_page=500`,
    );
    const allocations = res?.data;
    if (!allocations || !Array.isArray(allocations)) {
      throw new HttpException(
        'Failed to fetch allocations from panel',
        HttpStatus.BAD_GATEWAY,
      );
    }
    const unassigned = allocations.filter((a: any) => !a.attributes.assigned);
    if (unassigned.length === 0) {
      throw new HttpException(
        'No free allocations available on the selected node',
        HttpStatus.BAD_REQUEST,
      );
    }
    return unassigned[0].attributes.id;
  }

  async getEggData(
    nestId: number,
    eggId: number,
  ): Promise<{ startup: string; environment: Record<string, string> }> {
    const res = await this.request<any>(`/nests/${nestId}/eggs/${eggId}?include=variables`);
    const egg = res?.attributes;
    if (!egg) {
      throw new HttpException(
        `Egg ${eggId} not found in nest ${nestId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    const environment: Record<string, string> = {};
    if (egg.relationships?.variables?.data) {
      for (const v of egg.relationships.variables.data) {
        environment[v.attributes.env_variable] =
          v.attributes.default_value || '';
      }
    }
    return {
      startup: egg.startup,
      environment,
    };
  }

  async createServer(input: CreateServerInput): Promise<any> {
    const allocationId = await this.getFreeAllocation(input.nodeId);
    const eggData = await this.getEggData(input.nestId, input.eggId);

    const data = await this.request<any>('/servers', 'POST', {
      name: input.name,
      user: input.userId,
      egg: input.eggId,
      docker_image: input.dockerImage || 'ghcr.io/pterodactyl/yolks:nodejs_18',
      startup: eggData.startup,
      environment: eggData.environment,
      limits: {
        memory: input.ram,
        swap: 0,
        cpu: input.cpu,
        disk: input.disk,
        io: 500,
      },
      feature_limits: {
        databases: input.databasesLimit,
        allocations: input.allocationsLimit,
        backups: input.backupLimit,
      },
      allocation: {
        default: allocationId,
      },
    });

    return data;
  }

  async suspendServer(serverId: string): Promise<void> {
    await this.request(`/servers/${serverId}/suspend`, 'POST');
  }

  async unsuspendServer(serverId: string): Promise<void> {
    await this.request(`/servers/${serverId}/unsuspend`, 'POST');
  }

  async deleteServer(serverId: string): Promise<void> {
    await this.request(`/servers/${serverId}`, 'DELETE');
  }

  async getServer(serverId: string): Promise<any> {
    return this.request<any>(`/servers/${serverId}`);
  }

  async updateServerBuild(
    serverId: string,
    build: {
      memory?: number;
      cpu?: number;
      disk?: number;
    },
  ): Promise<any> {
    const existingServer = await this.getServer(serverId);
    const attrs = existingServer.attributes;

    return this.request<any>(`/servers/${serverId}/build`, 'PATCH', {
      allocation: attrs.allocation,
      memory: build.memory !== undefined ? build.memory : attrs.limits.memory,
      swap: attrs.limits.swap,
      io: attrs.limits.io,
      cpu: build.cpu !== undefined ? build.cpu : attrs.limits.cpu,
      disk: build.disk !== undefined ? build.disk : attrs.limits.disk,
      threads: attrs.limits.threads,
      feature_limits: {
        databases: attrs.feature_limits.databases,
        allocations: attrs.feature_limits.allocations,
        backups: attrs.feature_limits.backups,
      },
    });
  }

  async listUsers(page: number = 1, perPage: number = 50): Promise<any> {
    return this.request<any>(`/users?page=${page}&per_page=${perPage}`);
  }

  async getPterodactylUser(userId: number): Promise<any> {
    return this.request<any>(`/users/${userId}`);
  }

  async updatePterodactylUser(
    userId: number,
    data: {
      username?: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      password?: string;
    },
  ): Promise<any> {
    return this.request<any>(`/users/${userId}`, 'PATCH', data);
  }

  async getLocations(): Promise<any[]> {
    const res = await this.request<any>('/locations');
    return res.data;
  }

  async getServerUtilization(serverId: string): Promise<any> {
    return this.request<any>(`/servers/${serverId}/utilization`);
  }

  async transferServer(
    serverId: string,
    userId: number,
  ): Promise<any> {
    return this.request<any>(`/servers/${serverId}/transfer`, 'POST', {
      user: userId,
    });
  }

  async getAllocations(nodeId: number): Promise<any[]> {
    const res = await this.request<any>(
      `/nodes/${nodeId}/allocations?per_page=500`,
    );
    return res.data;
  }

  async getNests(): Promise<any[]> {
    try {
      const res = await this.request<any>('/nests?include=eggs');
      return res.data || [];
    } catch (error) {
      this.logger.error('Failed to fetch nests from Pterodactyl', error);
      return [];
    }
  }

  async getEggsByNest(nestId: number): Promise<any[]> {
    try {
      // Use the dedicated eggs endpoint for more reliable results
      const res = await this.request<any>(`/nests/${nestId}/eggs`);
      return res.data || [];
    } catch (error) {
      this.logger.warn(`Failed to fetch eggs for nest ${nestId} via dedicated endpoint, trying include=eggs`);
      try {
        // Fallback: try with include=eggs on the nest endpoint
        const res = await this.request<any>(`/nests/${nestId}?include=eggs`);
        return res.data?.attributes?.eggs?.data || [];
      } catch (fallbackError) {
        this.logger.error(`Failed to fetch eggs for nest ${nestId}`, fallbackError);
        return [];
      }
    }
  }

  async getNodes(): Promise<any[]> {
    try {
      const res = await this.request<any>('/nodes');
      return res.data || [];
    } catch (error) {
      this.logger.error('Failed to fetch nodes from Pterodactyl', error);
      return [];
    }
  }
}
