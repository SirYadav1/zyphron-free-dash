import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from '../entities/voucher.entity';
import { UserVoucher } from '../entities/user-voucher.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(UserVoucher)
    private readonly userVoucherRepo: Repository<UserVoucher>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
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
}
