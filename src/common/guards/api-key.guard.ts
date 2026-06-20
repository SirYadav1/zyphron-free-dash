import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

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
      'SELECT id, token, is_active FROM application_apis WHERE token = ?',
      [apiKey],
    );

    if (!api?.[0]) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (api[0].is_active === 0) {
      throw new UnauthorizedException('API key is disabled');
    }

    // attach API info to request for logging
    request.apiKey = api[0];
    return true;
  }
}
