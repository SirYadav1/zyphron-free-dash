import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from '../entities/coupon.entity';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon) private readonly couponRepo: Repository<Coupon>,
  ) {}

  async findAll(): Promise<Coupon[]> {
    return this.couponRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: number): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async create(dto: Partial<Coupon>): Promise<Coupon> {
    return this.couponRepo.save(this.couponRepo.create(dto));
  }

  async update(id: number, dto: Partial<Coupon>): Promise<Coupon> {
    await this.findOne(id);
    await this.couponRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.couponRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Coupon not found');
  }
}
