import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../entities/transaction.entity';
import { EconomyController } from './economy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  controllers: [EconomyController],
})
export class EconomyModule {}
