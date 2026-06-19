import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { ApplicationApi } from '../entities/application-api.entity';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApplicationApi)
    private readonly apiRepo: Repository<ApplicationApi>,
  ) {}

  async findAll(): Promise<ApplicationApi[]> {
    return this.apiRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: number): Promise<ApplicationApi> {
    const api = await this.apiRepo.findOne({ where: { id } });
    if (!api) throw new NotFoundException('API key not found');
    return api;
  }

  async create(dto: Partial<ApplicationApi>): Promise<ApplicationApi> {
    const token = dto.token || randomBytes(32).toString('hex');
    return this.apiRepo.save(this.apiRepo.create({ ...dto, token }));
  }

  async update(
    id: number,
    dto: Partial<ApplicationApi>,
  ): Promise<ApplicationApi> {
    await this.findOne(id);
    await this.apiRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.apiRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('API key not found');
  }
}
