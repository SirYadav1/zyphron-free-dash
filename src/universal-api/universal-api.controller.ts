import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiKeyGuard, RequirePermission } from '../common/guards/api-key.guard';
import { DataSource } from 'typeorm';

@Controller('v1')
@UseGuards(ApiKeyGuard)
export class UniversalApiController {
  constructor(private readonly dataSource: DataSource) {}

  // ============================================================
  // HEALTH & INFO (no permission needed)
  // ============================================================

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

  // ============================================================
  // USER ENDPOINTS
  // ============================================================

  @Get('users/:id')
  @RequirePermission('users', 'read')
  async getUser(@Param('id') id: string) {
    const user = await this.dataSource.query(
      'SELECT id, username, email, first_name, last_name, is_admin, coins, created_at FROM users WHERE id = ?',
      [id],
    );
    if (!user?.[0]) {
      return { error: 'User not found', statusCode: 404 };
    }
    return user[0];
  }

  @Get('users')
  @RequirePermission('users', 'read')
  async listUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = 'SELECT id, username, email, first_name, last_name, is_admin, coins, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const params: any[] = [];

    if (search) {
      const searchClause =
        ' WHERE username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?';
      query += searchClause;
      countQuery += searchClause;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const users = await this.dataSource.query(query, params);
    const total = await this.dataSource.query(countQuery, params);

    return {
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total[0]?.total || 0,
        pages: Math.ceil((total[0]?.total || 0) / limitNum),
      },
    };
  }

  // ============================================================
  // SERVER ENDPOINTS
  // ============================================================

  @Get('servers/:id')
  @RequirePermission('servers', 'read')
  async getServer(@Param('id') id: string) {
    const server = await this.dataSource.query(
      'SELECT id, server_name, ram_mb, cpu_percent, disk_mb, status, created_at FROM servers WHERE id = ?',
      [id],
    );
    if (!server?.[0]) {
      return { error: 'Server not found', statusCode: 404 };
    }
    return server[0];
  }

  @Get('servers')
  @RequirePermission('servers', 'read')
  async listServers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('user_id') userId?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query =
      'SELECT id, server_name, ram_mb, cpu_percent, disk_mb, status, user_id, created_at FROM servers';
    let countQuery = 'SELECT COUNT(*) as total FROM servers';
    const params: any[] = [];

    if (userId) {
      query += ' WHERE user_id = ?';
      countQuery += ' WHERE user_id = ?';
      params.push(userId);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const servers = await this.dataSource.query(query, params);
    const total = await this.dataSource.query(countQuery, params);

    return {
      data: servers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total[0]?.total || 0,
        pages: Math.ceil((total[0]?.total || 0) / limitNum),
      },
    };
  }

  // ============================================================
  // STATS ENDPOINTS
  // ============================================================

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
      users: users[0]?.count || 0,
      servers: servers[0]?.count || 0,
      tickets: tickets[0]?.count || 0,
      transactions: transactions[0]?.count || 0,
    };
  }

  // ============================================================
  // TICKET ENDPOINTS
  // ============================================================

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
    return ticket[0];
  }

  @Get('tickets')
  @RequirePermission('tickets', 'read')
  async listTickets(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('user_id') userId?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query =
      'SELECT id, subject, status, priority, user_id, created_at FROM tickets';
    let countQuery = 'SELECT COUNT(*) as total FROM tickets';
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const tickets = await this.dataSource.query(query, params);
    const total = await this.dataSource.query(countQuery, params);

    return {
      data: tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total[0]?.total || 0,
        pages: Math.ceil((total[0]?.total || 0) / limitNum),
      },
    };
  }

  // ============================================================
  // COUPON ENDPOINTS
  // ============================================================

  @Get('coupons')
  @RequirePermission('coupons', 'read')
  async listCoupons(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const coupons = await this.dataSource.query(
      `SELECT id, code, discount_type, discount_value, max_uses, used_count, expires_at, is_active, created_at 
       FROM coupons ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`,
    );
    const total = await this.dataSource.query(
      'SELECT COUNT(*) as total FROM coupons',
    );

    return {
      data: coupons,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total[0]?.total || 0,
        pages: Math.ceil((total[0]?.total || 0) / limitNum),
      },
    };
  }

  // ============================================================
  // PRODUCT ENDPOINTS
  // ============================================================

  @Get('products')
  @RequirePermission('products', 'read')
  async listProducts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('category') category?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query =
      'SELECT id, name, price, description, category, is_active, created_at FROM products';
    let countQuery = 'SELECT COUNT(*) as total FROM products';
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      countQuery += ' WHERE category = ?';
      params.push(category);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const products = await this.dataSource.query(query, params);
    const total = await this.dataSource.query(countQuery, params);

    return {
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total[0]?.total || 0,
        pages: Math.ceil((total[0]?.total || 0) / limitNum),
      },
    };
  }

  // ============================================================
  // WEBHOOK ENDPOINTS
  // ============================================================

  @Post('webhooks/test')
  @RequirePermission('webhooks', 'write')
  @HttpCode(200)
  async testWebhook(@Body() body: any) {
    return {
      received: true,
      timestamp: new Date().toISOString(),
      data: body,
    };
  }
}
