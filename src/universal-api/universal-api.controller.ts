import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  Headers,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ApiKeyGuard, RequirePermission } from '../common/guards/api-key.guard';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Controller('v1')
@UseGuards(ApiKeyGuard)
export class UniversalApiController {
  constructor(private readonly dataSource: DataSource) {}

  // health & info (no permission needed)

  @Get('health')
  async health() {
    return {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('permissions')
  async getPermissions() {
    const { PERMISSIONS } = require('../common/guards/api-key.guard');
    return PERMISSIONS;
  }

  // user creation - called by main site

  @Post('users')
  @RequirePermission('users', 'write')
  @HttpCode(201)
  async createUser(
    @Body() body: {
      username: string;
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
    },
  ) {
    // validate required fields
    if (!body.username || !body.email || !body.password) {
      throw new BadRequestException('username, email, and password are required');
    }
    if (body.username.length < 3) {
      throw new BadRequestException('Username must be at least 3 characters');
    }
    if (body.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // check if email already exists
    const existingEmail = await this.dataSource.query(
      'SELECT id FROM users WHERE email = ?',
      [body.email.toLowerCase()],
    );
    if (existingEmail?.[0]) {
      throw new ConflictException('Email already registered');
    }

    // check if username already exists
    const existingUsername = await this.dataSource.query(
      'SELECT id FROM users WHERE username = ?',
      [body.username],
    );
    if (existingUsername?.[0]) {
      throw new ConflictException('Username already taken');
    }

    // hash password
    const passwordHash = await bcrypt.hash(body.password, 10);
    const userId = crypto.randomUUID();

    // create user in dashboard DB
    await this.dataSource.query(
      `INSERT INTO users (id, username, email, first_name, last_name, password_hash, coins, email_verified, created_at, last_active)
       VALUES (?, ?, ?, ?, ?, ?, 100, 1, datetime('now'), datetime('now'))`,
      [
        userId,
        body.username,
        body.email.toLowerCase(),
        body.first_name || null,
        body.last_name || null,
        passwordHash,
      ],
    );

    // auto-sync to Pterodactyl (non-blocking, wrapped in try/catch)
    let pterodactylUserId: number | null = null;
    try {
      const { PterodactylService } = require('../pterodactyl/pterodactyl.service');
      // go through the data source, the service is not exported here
      const pteroResult = await this.dataSource.query(
        `SELECT value FROM settings WHERE key = 'pterodactyl_panel_url'`,
      );
      const pteroApiKey = await this.dataSource.query(
        `SELECT value FROM settings WHERE key = 'pterodactyl_api_key'`,
      );

      if (pteroResult?.[0]?.value && pteroApiKey?.[0]?.value) {
        const panelUrl = pteroResult[0].value.replace(/\/$/, '');
        const apiKey = pteroApiKey[0].value;

        const response = await fetch(`${panelUrl}/api/application/users`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.pterodactyl.v1+json',
          },
          body: JSON.stringify({
            username: body.username,
            email: body.email.toLowerCase(),
            first_name: body.first_name || body.username,
            last_name: body.last_name || 'User',
            password: body.password,
          }),
        });

        if (response.ok) {
          const pteroData = await response.json();
          pterodactylUserId = pteroData?.attributes?.id || pteroData?.id;
          if (pterodactylUserId) {
            await this.dataSource.query(
              'UPDATE users SET pterodactyl_user_id = ?, pterodactyl_username = ? WHERE id = ?',
              [pterodactylUserId, body.username, userId],
            );
          }
        }
      }
    } catch (err) {
      // sync failed, the dashboard user exists anyway
      // will sync on first login via existing syncPterodactylAccount()
    }

    return {
      object: 'user',
      attributes: {
        id: userId,
        username: body.username,
        email: body.email.toLowerCase(),
        first_name: body.first_name || null,
        last_name: body.last_name || null,
        coins: 100,
        pterodactyl_user_id: pterodactylUserId,
        email_verified: true,
        created_at: new Date().toISOString(),
      },
    };
  }

  // user endpoints

  @Get('users/:id')
  @RequirePermission('users', 'read')
  async getUser(
    @Param('id') id: string,
    @Query('include') include?: string,
  ) {
    const user = await this.dataSource.query(
      'SELECT id, username, email, first_name, last_name, is_admin, coins, created_at FROM users WHERE id = ?',
      [id],
    );
    if (!user?.[0]) {
      return { error: 'User not found', statusCode: 404 };
    }

    const result: any = {
      object: 'user',
      attributes: this.formatUser(user[0]),
    };

    // include servers if requested
    if (include === 'servers') {
      const servers = await this.dataSource.query(
        'SELECT id, server_name, ram_mb, cpu_percent, disk_mb, status, created_at FROM servers WHERE user_id = ?',
        [id],
      );
      result.relationships = {
        servers: {
          object: 'list',
          data: servers.map((s: any) => ({
            object: 'server',
            attributes: this.formatServer(s),
          })),
        },
      };
    }

    return result;
  }

  @Get('users')
  @RequirePermission('users', 'read')
  async listUsers(
    @Query('page') page: string = '1',
    @Query('per_page') perPage: string = '50',
    @Query('filter[username]') filterUsername?: string,
    @Query('filter[email]') filterEmail?: string,
    @Query('filter[is_admin]') filterIsAdmin?: string,
    @Query('sort') sort: string = 'id',
    @Query('include') include?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(perPage) || 50));
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT id, username, email, first_name, last_name, is_admin, coins, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const conditions: string[] = [];
    const params: any[] = [];

    // apply filters
    if (filterUsername) {
      conditions.push('username LIKE ?');
      params.push(`%${filterUsername}%`);
    }
    if (filterEmail) {
      conditions.push('email LIKE ?');
      params.push(`%${filterEmail}%`);
    }
    if (filterIsAdmin !== undefined) {
      conditions.push('is_admin = ?');
      params.push(filterIsAdmin === 'true' ? 1 : 0);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // apply sorting
    const allowedSorts = ['id', 'username', 'email', 'created_at'];
    const sortField = allowedSorts.includes(sort) ? sort : 'id';
    query += ` ORDER BY ${sortField} ASC`;

    query += ` LIMIT ${limitNum} OFFSET ${offset}`;

    const users = await this.dataSource.query(query, params);
    const total = await this.dataSource.query(countQuery, params);
    const totalCount = total[0]?.total || 0;

    // include servers if requested
    let relationships: any = undefined;
    if (include === 'servers') {
      const userIds = users.map((u: any) => u.id);
      if (userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(',');
        const servers = await this.dataSource.query(
          `SELECT id, server_name, ram_mb, cpu_percent, disk_mb, status, user_id, created_at FROM servers WHERE user_id IN (${placeholders})`,
          userIds,
        );
        relationships = {
          servers: servers.map((s: any) => ({
            object: 'server',
            attributes: this.formatServer(s),
          })),
        };
      }
    }

    return {
      object: 'list',
      data: users.map((u: any) => ({
        object: 'user',
        attributes: this.formatUser(u),
      })),
      ...(relationships && { relationships }),
      meta: {
        pagination: {
          total: totalCount,
          count: users.length,
          per_page: limitNum,
          current_page: pageNum,
          total_pages: Math.ceil(totalCount / limitNum),
        },
      },
    };
  }

  // server endpoints

  @Get('servers/:id')
  @RequirePermission('servers', 'read')
  async getServer(@Param('id') id: string) {
    const server = await this.dataSource.query(
      'SELECT id, server_name, ram_mb, cpu_percent, disk_mb, status, user_id, created_at FROM servers WHERE id = ?',
      [id],
    );
    if (!server?.[0]) {
      return { error: 'Server not found', statusCode: 404 };
    }

    return {
      object: 'server',
      attributes: this.formatServer(server[0]),
    };
  }

  @Get('servers')
  @RequirePermission('servers', 'read')
  async listServers(
    @Query('page') page: string = '1',
    @Query('per_page') perPage: string = '50',
    @Query('filter[server_name]') filterName?: string,
    @Query('filter[status]') filterStatus?: string,
    @Query('filter[user_id]') filterUserId?: string,
    @Query('sort') sort: string = 'id',
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(perPage) || 50));
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT id, server_name, ram_mb, cpu_percent, disk_mb, status, user_id, created_at FROM servers';
    let countQuery = 'SELECT COUNT(*) as total FROM servers';
    const conditions: string[] = [];
    const params: any[] = [];

    // apply filters
    if (filterName) {
      conditions.push('server_name LIKE ?');
      params.push(`%${filterName}%`);
    }
    if (filterStatus) {
      conditions.push('status = ?');
      params.push(filterStatus);
    }
    if (filterUserId) {
      conditions.push('user_id = ?');
      params.push(filterUserId);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // apply sorting
    const allowedSorts = ['id', 'server_name', 'status', 'created_at'];
    const sortField = allowedSorts.includes(sort) ? sort : 'id';
    query += ` ORDER BY ${sortField} ASC`;

    query += ` LIMIT ${limitNum} OFFSET ${offset}`;

    const servers = await this.dataSource.query(query, params);
    const total = await this.dataSource.query(countQuery, params);
    const totalCount = total[0]?.total || 0;

    return {
      object: 'list',
      data: servers.map((s: any) => ({
        object: 'server',
        attributes: this.formatServer(s),
      })),
      meta: {
        pagination: {
          total: totalCount,
          count: servers.length,
          per_page: limitNum,
          current_page: pageNum,
          total_pages: Math.ceil(totalCount / limitNum),
        },
      },
    };
  }

  // stats endpoints

  @Get('stats')
  @RequirePermission('stats', 'read')
  async getStats() {
    const users = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM users',
    );
    const servers = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM servers',
    );
    const tickets = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM tickets',
    );
    const transactions = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM transactions',
    );

    return {
      object: 'stats',
      attributes: {
        users: users[0]?.count || 0,
        servers: servers[0]?.count || 0,
        tickets: tickets[0]?.count || 0,
        transactions: transactions[0]?.count || 0,
      },
    };
  }

  // ticket endpoints

  @Get('tickets/:id')
  @RequirePermission('tickets', 'read')
  async getTicket(@Param('id') id: string) {
    const ticket = await this.dataSource.query(
      'SELECT id, subject, status, priority, user_id, created_at FROM tickets WHERE id = ?',
      [id],
    );
    if (!ticket?.[0]) {
      return { error: 'Ticket not found', statusCode: 404 };
    }

    return {
      object: 'ticket',
      attributes: this.formatTicket(ticket[0]),
    };
  }

  @Get('tickets')
  @RequirePermission('tickets', 'read')
  async listTickets(
    @Query('page') page: string = '1',
    @Query('per_page') perPage: string = '50',
    @Query('filter[status]') filterStatus?: string,
    @Query('filter[priority]') filterPriority?: string,
    @Query('filter[user_id]') filterUserId?: string,
    @Query('sort') sort: string = 'id',
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(perPage) || 50));
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT id, subject, status, priority, user_id, created_at FROM tickets';
    let countQuery = 'SELECT COUNT(*) as total FROM tickets';
    const conditions: string[] = [];
    const params: any[] = [];

    // apply filters
    if (filterStatus) {
      conditions.push('status = ?');
      params.push(filterStatus);
    }
    if (filterPriority) {
      conditions.push('priority = ?');
      params.push(filterPriority);
    }
    if (filterUserId) {
      conditions.push('user_id = ?');
      params.push(filterUserId);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // apply sorting
    const allowedSorts = ['id', 'status', 'priority', 'created_at'];
    const sortField = allowedSorts.includes(sort) ? sort : 'id';
    query += ` ORDER BY ${sortField} ASC`;

    query += ` LIMIT ${limitNum} OFFSET ${offset}`;

    const tickets = await this.dataSource.query(query, params);
    const total = await this.dataSource.query(countQuery, params);
    const totalCount = total[0]?.total || 0;

    return {
      object: 'list',
      data: tickets.map((t: any) => ({
        object: 'ticket',
        attributes: this.formatTicket(t),
      })),
      meta: {
        pagination: {
          total: totalCount,
          count: tickets.length,
          per_page: limitNum,
          current_page: pageNum,
          total_pages: Math.ceil(totalCount / limitNum),
        },
      },
    };
  }

  // coupon endpoints

  @Get('coupons')
  @RequirePermission('coupons', 'read')
  async listCoupons(
    @Query('page') page: string = '1',
    @Query('per_page') perPage: string = '50',
    @Query('filter[code]') filterCode?: string,
    @Query('sort') sort: string = 'id',
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(perPage) || 50));
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT id, code, discount_type, discount_value, max_uses, used_count, expires_at, is_active, created_at FROM coupons';
    let countQuery = 'SELECT COUNT(*) as total FROM coupons';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filterCode) {
      conditions.push('code LIKE ?');
      params.push(`%${filterCode}%`);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    const allowedSorts = ['id', 'code', 'discount_value', 'created_at'];
    const sortField = allowedSorts.includes(sort) ? sort : 'id';
    query += ` ORDER BY ${sortField} ASC LIMIT ${limitNum} OFFSET ${offset}`;

    const coupons = await this.dataSource.query(query, params);
    const total = await this.dataSource.query(countQuery, params);
    const totalCount = total[0]?.total || 0;

    return {
      object: 'list',
      data: coupons.map((c: any) => ({
        object: 'coupon',
        attributes: this.formatCoupon(c),
      })),
      meta: {
        pagination: {
          total: totalCount,
          count: coupons.length,
          per_page: limitNum,
          current_page: pageNum,
          total_pages: Math.ceil(totalCount / limitNum),
        },
      },
    };
  }

  // product endpoints

  @Get('products')
  @RequirePermission('products', 'read')
  async listProducts(
    @Query('page') page: string = '1',
    @Query('per_page') perPage: string = '50',
    @Query('filter[name]') filterName?: string,
    @Query('filter[category]') filterCategory?: string,
    @Query('sort') sort: string = 'id',
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(perPage) || 50));
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT id, name, price, description, category, is_active, created_at FROM products';
    let countQuery = 'SELECT COUNT(*) as total FROM products';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filterName) {
      conditions.push('name LIKE ?');
      params.push(`%${filterName}%`);
    }
    if (filterCategory) {
      conditions.push('category = ?');
      params.push(filterCategory);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    const allowedSorts = ['id', 'name', 'price', 'created_at'];
    const sortField = allowedSorts.includes(sort) ? sort : 'id';
    query += ` ORDER BY ${sortField} ASC LIMIT ${limitNum} OFFSET ${offset}`;

    const products = await this.dataSource.query(query, params);
    const total = await this.dataSource.query(countQuery, params);
    const totalCount = total[0]?.total || 0;

    return {
      object: 'list',
      data: products.map((p: any) => ({
        object: 'product',
        attributes: this.formatProduct(p),
      })),
      meta: {
        pagination: {
          total: totalCount,
          count: products.length,
          per_page: limitNum,
          current_page: pageNum,
          total_pages: Math.ceil(totalCount / limitNum),
        },
      },
    };
  }

  // webhook endpoints

  @Post('webhooks/test')
  @RequirePermission('webhooks', 'write')
  @HttpCode(200)
  async testWebhook(@Body() body: any) {
    return {
      object: 'webhook_response',
      attributes: {
        received: true,
        timestamp: new Date().toISOString(),
        data: body,
      },
    };
  }

  // helper methods

  private formatUser(user: any) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      root_admin: user.is_admin === 1,
      coins: user.coins,
      created_at: user.created_at,
    };
  }

  private formatServer(server: any) {
    return {
      id: server.id,
      name: server.server_name,
      ram_mb: server.ram_mb,
      cpu_percent: server.cpu_percent,
      disk_mb: server.disk_mb,
      status: server.status,
      user_id: server.user_id,
      created_at: server.created_at,
    };
  }

  private formatTicket(ticket: any) {
    return {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      user_id: ticket.user_id,
      created_at: ticket.created_at,
    };
  }

  private formatCoupon(coupon: any) {
    return {
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_uses: coupon.max_uses,
      used_count: coupon.used_count,
      expires_at: coupon.expires_at,
      is_active: coupon.is_active === 1,
      created_at: coupon.created_at,
    };
  }

  private formatProduct(product: any) {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      is_active: product.is_active === 1,
      created_at: product.created_at,
    };
  }
}
