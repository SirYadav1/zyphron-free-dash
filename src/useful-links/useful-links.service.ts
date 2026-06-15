import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsefulLink } from '../entities/useful-link.entity';

@Injectable()
export class UsefulLinksService {
  constructor(
    @InjectRepository(UsefulLink)
    private readonly linkRepo: Repository<UsefulLink>,
  ) {}

  async findAll(): Promise<UsefulLink[]> {
    return this.linkRepo.find({ order: { title: 'ASC' } });
  }

  async findOne(id: number): Promise<UsefulLink> {
    const link = await this.linkRepo.findOne({ where: { id } });
    if (!link) throw new NotFoundException('Useful link not found');
    return link;
  }

  async create(dto: Partial<UsefulLink>): Promise<UsefulLink> {
    return this.linkRepo.save(this.linkRepo.create(dto));
  }

  async update(id: number, dto: Partial<UsefulLink>): Promise<UsefulLink> {
    await this.findOne(id);
    await this.linkRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.linkRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Useful link not found');
  }
}
