import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Hard admin gate (H1 fix).
 *
 * Only the `is_admin` flag grants admin access. The previous fallback —
 * "any row in user_roles = full admin" — gave every staff member access to
 * user management, coin setting, and API-key decryption. Role rows
 * (Owner/Staff/…) carry only ticket/coin-approve permissions and are checked
 * by their own feature logic, never as an admin bypass.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required');
    }

    // JwtAuthGuard already loaded the live row — use it when present
    if (user.is_admin === 1 || user.is_admin === true) {
      return true;
    }

    // fallback: fetch the authoritative flag from the DB
    const dbUser = await this.dataSource.query(
      'SELECT is_admin FROM users WHERE id = ?',
      [user.id],
    );
    if (dbUser?.[0]?.is_admin) {
      return true;
    }

    throw new ForbiddenException('Admin access required');
  }
}
