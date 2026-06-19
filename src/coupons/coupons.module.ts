import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from '../entities/coupon.entity';
import { User } from '../entities/user.entity';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, User])],
  controllers: [CouponsController],
  providers: [CouponsService],
})
export class CouponsModule {}
