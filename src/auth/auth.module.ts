import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TwoFactorController } from './two-factor.controller';
import { TwoFactorService } from './two-factor.service';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';
import { Setting } from '../entities/setting.entity';
import { AfkSession } from '../entities/afk-session.entity';
import { DailyLogin } from '../entities/daily-login.entity';
import { PterodactylModule } from '../pterodactyl/pterodactyl.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Transaction,
      Setting,
      AfkSession,
      DailyLogin,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return {
          secret,
          signOptions: { expiresIn: '7d' },
        };
      },
    }),
    PterodactylModule,
  ],
  controllers: [AuthController, TwoFactorController],
  providers: [AuthService, JwtAuthGuard, TwoFactorService],
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
