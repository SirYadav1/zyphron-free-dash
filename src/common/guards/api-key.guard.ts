import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';

// available permissions
export const PERMISSIONS = {
  users: {
    label: 'Users',
    actions: ['read', 'write', 'delete'],
  },
  servers: {
    label: 'Servers',
    actions: ['read', 'write', 'delete', 'suspend', 'unsuspend'],
  },
  tickets: {
    label: 'Tickets',
    actions: ['read', 'write', 'close', 'delete'],
  },
  coupons: {
    label: 'Coupons',
    actions: ['read', 'write', 'delete'],
  },
  products: {
    label: 'Products',
    actions: ['read', 'write', 'delete'],
  },
  stats: {
    label: 'Statistics',
    actions: ['read'],
  },
  webhooks: {
    label: 'Webhooks',
    actions: ['write'],
  },
};

// metadata key for permissions
export const PERMISSION_KEY = 'permissions';
export const RequirePermission = (resource: string, action: string) =>
  SetMetadata(PERMISSION_KEY, { resource, action });

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly dataSource: DataSource,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey =
      request.headers['x-api-key'] ||
      request.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      throw new UnauthorizedException(
        'API key required. Provide via X-API-Key header or Authorization: Bearer <key>',
      );
    }

    // check if API key exists and is active
    const api = await this.dataSource.query(
      'SELECT id, token, is_active, permissions, ip_whitelist, rate_limit FROM application_apis WHERE token = ?',
      [apiKey],
    );

    if (!api?.[0]) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (api[0].is_active === 0) {
      throw new UnauthorizedException('API key is disabled');
    }

    // check IP whitelist
    const clientIp = request.ip || request.connection?.remoteAddress;
    if (api[0].ip_whitelist && clientIp) {
      const allowedIps = api[0].ip_whitelist.split(',').map((ip: string) => ip.trim());
      if (!allowedIps.includes(clientIp)) {
        throw new ForbiddenException('IP not allowed');
      }
    }

    // attach API info to request
    const permissionsList = JSON.parse(api[0].permissions || '[]');
    request.apiKey = {
      id: api[0].id,
      token: api[0].token,
      permissions: api[0].permissions,
      permissionsList,
      ip_whitelist: api[0].ip_whitelist,
      rate_limit: api[0].rate_limit,
    };

    // check method-level permissions
    const requiredPermission = this.reflector.get<{ resource: string; action: string }>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    if (requiredPermission) {
      const { resource, action } = requiredPermission;
      const hasPermission =
        permissionsList.includes(`${resource}:${action}`) ||
        permissionsList.includes(`${resource}:*`) ||
        permissionsList.includes('*:*');

      if (!hasPermission) {
        throw new ForbiddenException(
          `Permission denied: ${resource}:${action} required`,
        );
      }
    }

    return true;
  }
}
