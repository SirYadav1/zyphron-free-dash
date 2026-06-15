import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AfkSession } from '../entities/afk-session.entity';
import { User } from '../entities/user.entity';
import { Setting } from '../entities/setting.entity';
import { Transaction } from '../entities/transaction.entity';
import { AfkController } from './afk.controller';
import { AfkService } from './afk.service';

@Module({
  imports: [TypeOrmModule.forFeature([AfkSession, User, Setting, Transaction])],
  controllers: [AfkController],
  providers: [AfkService],
})
export class AfkModule {}
