import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check is_admin flag
    const dbUser = await this.dataSource.query(
      'SELECT is_admin FROM users WHERE id = ?',
      [user.id],
    );
    if (dbUser?.[0]?.is_admin) {
      return true;
    }

    // Check if user has any role assigned (Owner, Co-Founder, CEO, Staff = admin access)
    const hasRole = await this.dataSource.query(
      'SELECT id FROM user_roles WHERE user_id = ? LIMIT 1',
      [user.id],
    );
    if (hasRole?.[0]) {
      return true;
    }

    throw new ForbiddenException('Admin access required');
  }
}
