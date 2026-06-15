import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinOrder } from '../entities/coin-order.entity';
import { User } from '../entities/user.entity';
import { CoinOrdersService } from './coin-orders.service';
import { CoinOrdersController } from './coin-orders.controller';
import { AdminCoinOrdersController } from './admin-coin-orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CoinOrder, User])],
  controllers: [CoinOrdersController, AdminCoinOrdersController],
  providers: [CoinOrdersService],
})
export class CoinOrdersModule {}
