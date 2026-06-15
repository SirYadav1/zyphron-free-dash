import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Server } from '../entities/server.entity';
import { AfkSession } from '../entities/afk-session.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { DailyLogin } from '../entities/daily-login.entity';
import { Transaction } from '../entities/transaction.entity';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Server,
      AfkSession,
      UserAchievement,
      DailyLogin,
      Transaction,
    ]),
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
