import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

/**
 * JWT auth gate (H4 fix).
 *
 * The token is verified, then the LIVE user row is loaded on every request:
 * bans take effect immediately instead of after the 7-day token expiry, and
 * revoked/nonexistent accounts are rejected. request.user receives a
 * sanitized copy of the row (secrets stripped) for downstream guards/controllers.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.split(' ')[1];

    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }
    if (user.is_banned) {
      throw new UnauthorizedException('Account banned');
    }

    // strip secrets before exposing the row to controllers
    const { password_hash, two_factor_secret, verification_token, ...safeUser } =
      user as any;
    request.user = safeUser;
    return true;
  }
}
