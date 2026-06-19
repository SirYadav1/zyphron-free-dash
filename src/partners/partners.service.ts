import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerDiscount } from '../entities/partner-discount.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(PartnerDiscount)
    private readonly partnerRepo: Repository<PartnerDiscount>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<PartnerDiscount[]> {
    return this.partnerRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: number): Promise<PartnerDiscount> {
    const partner = await this.partnerRepo.findOne({ where: { id } });
    if (!partner) throw new NotFoundException('Partner not found');
    return partner;
  }

  async create(dto: Partial<PartnerDiscount>): Promise<PartnerDiscount> {
    return this.partnerRepo.save(this.partnerRepo.create(dto));
  }

  async update(
    id: number,
    dto: Partial<PartnerDiscount>,
  ): Promise<PartnerDiscount> {
    await this.findOne(id);
    await this.partnerRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.partnerRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Partner not found');
  }

  async getUsers(id: number): Promise<any[]> {
    const partner = await this.partnerRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!partner) throw new NotFoundException('Partner not found');
    return partner.user
      ? [
          {
            id: partner.user.id,
            username: partner.user.username,
            createdAt: partner.user.created_at,
          },
        ]
      : [];
  }
}
