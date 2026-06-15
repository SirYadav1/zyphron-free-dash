import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from '../entities/voucher.entity';
import { UserVoucher } from '../entities/user-voucher.entity';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class VouchersService {
  private readonly logger = new Logger(VouchersService.name);

  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(UserVoucher)
    private readonly userVoucherRepo: Repository<UserVoucher>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
  ) {}

  async findAll(): Promise<Voucher[]> {
    return this.voucherRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: number): Promise<Voucher> {
    const voucher = await this.voucherRepo.findOne({ where: { id } });
    if (!voucher) throw new NotFoundException('Voucher not found');
    return voucher;
  }

  async create(dto: Partial<Voucher>): Promise<Voucher> {
    return this.voucherRepo.save(this.voucherRepo.create(dto));
  }

  async update(id: number, dto: Partial<Voucher>): Promise<Voucher> {
    const voucher = await this.findOne(id);
    await this.voucherRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.voucherRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Voucher not found');
  }

  async getUsers(id: number): Promise<any[]> {
    const voucher = await this.findOne(id);
    return this.userVoucherRepo.find({
      where: { voucher_id: id },
      relations: { user: true },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * User-facing: redeem a voucher code for coins
   */
  async redeem(userId: string, code: string): Promise<{ message: string; credits: number; newBalance: number }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.is_banned) throw new BadRequestException('Your account is banned');

    const voucher = await this.voucherRepo.findOne({ where: { code: code.toUpperCase().trim() } });
    if (!voucher) throw new NotFoundException('Invalid voucher code');

    // check expiry
    if (voucher.expires_at) {
      const expiresAt = new Date(voucher.expires_at);
      if (expiresAt < new Date()) {
        throw new BadRequestException('This voucher has expired');
      }
    }

    // check if user already redeemed this voucher
    const existingRedemption = await this.userVoucherRepo.findOne({
      where: { user_id: userId, voucher_id: voucher.id },
    });
    if (existingRedemption) {
      throw new BadRequestException('You have already redeemed this voucher');
    }

    // check remaining uses (uses > 0 means limited, uses = 0 means unlimited)
    if (voucher.uses > 0) {
      const totalRedeemed = await this.userVoucherRepo.count({
        where: { voucher_id: voucher.id },
      });
      if (totalRedeemed >= voucher.uses) {
        throw new BadRequestException('This voucher has reached its maximum uses');
      }
    }

    // add credits
    const newBalance = user.coins + voucher.credits;
    await this.userRepo.update(userId, { coins: newBalance });

    // record redemption
    await this.userVoucherRepo.save(
      this.userVoucherRepo.create({ user_id: userId, voucher_id: voucher.id }),
    );

    // record transaction
    await this.transactionRepo.save(
      this.transactionRepo.create({
        user_id: userId,
        type: 'voucher_redeem',
        amount: voucher.credits,
        description: `Redeemed voucher: ${voucher.code}`,
      }),
    );

    this.logger.log(`User ${userId} redeemed voucher ${voucher.code} for ${voucher.credits} coins`);

    return {
      message: `Successfully redeemed ${voucher.credits} coins!`,
      credits: voucher.credits,
      newBalance,
    };
  }
}
