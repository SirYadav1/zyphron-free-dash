import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopProduct } from '../entities/shop-product.entity';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';
import { Invoice } from '../entities/invoice.entity';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShopProduct, User, Transaction, Invoice]),
    ActivityLogsModule,
  ],
  controllers: [CreditsController],
  providers: [CreditsService],
})
export class CreditsModule {}
