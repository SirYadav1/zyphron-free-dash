import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from '../entities/voucher.entity';
import { UserVoucher } from '../entities/user-voucher.entity';
import { User } from '../entities/user.entity';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher, UserVoucher, User])],
  controllers: [VouchersController],
  providers: [VouchersService],
})
export class VouchersModule {}
