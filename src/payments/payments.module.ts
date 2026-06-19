import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { Invoice } from '../entities/invoice.entity';
import { User } from '../entities/user.entity';
import { ShopProduct } from '../entities/shop-product.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Invoice, User, ShopProduct])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
