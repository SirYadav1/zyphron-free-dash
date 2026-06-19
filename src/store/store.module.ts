import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from '../entities/server.entity';
import { Setting } from '../entities/setting.entity';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';
import { ShopProduct } from '../entities/shop-product.entity';
import { StoreController } from './store.controller';
import { AdminStoreController } from './admin-store.controller';
import { StoreService } from './store.service';
import { PterodactylModule } from '../pterodactyl/pterodactyl.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server, User, Setting, Transaction, ShopProduct]),
    PterodactylModule,
  ],
  controllers: [StoreController, AdminStoreController],
  providers: [StoreService],
})
export class StoreModule {}
