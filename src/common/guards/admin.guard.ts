import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../entities/user-role.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check is_admin flag
    const dbUser = await this.userRepo.findOne({ where: { id: user.id } });
    if (dbUser && dbUser.is_admin) {
      return true;
    }

    // Check if user has any role assigned (Owner, Co-Founder, CEO, Staff = admin access)
    const hasRole = await this.userRoleRepo.findOne({ where: { user_id: user.id } });
    if (hasRole) {
      return true;
    }

    throw new ForbiddenException('Admin access required');
  }
}
