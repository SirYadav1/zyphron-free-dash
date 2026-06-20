import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('Authentication required.');
    }

    const fullUser = await this.userRepo.findOne({ where: { id: user.id } });
    
    if (!fullUser) {
      throw new ForbiddenException('User not found.');
    }

    if (!fullUser.email_verified) {
      throw new ForbiddenException({
        message: 'Email verification required. Please verify your email to access this resource.',
        code: 'EMAIL_NOT_VERIFIED',
        email: fullUser.email,
      });
    }

    return true;
  }
}
