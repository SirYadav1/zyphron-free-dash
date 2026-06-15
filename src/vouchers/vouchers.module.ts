import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from '../entities/voucher.entity';
import { UserVoucher } from '../entities/user-voucher.entity';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';
import { VouchersService } from './vouchers.service';
import { VouchersController, UserVouchersController } from './vouchers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher, UserVoucher, User, Transaction])],
  controllers: [VouchersController, UserVouchersController],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
