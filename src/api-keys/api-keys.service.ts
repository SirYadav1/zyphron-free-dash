import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
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

  async create(dto: Partial<ApplicationApi>): Promise<{ api: ApplicationApi; token: string }> {
    const token = dto.token || this.generateToken();
    
    const api = await this.apiRepo.save(
      this.apiRepo.create({
        ...dto,
        token,
        permissions: typeof dto.permissions === 'string' ? dto.permissions : JSON.stringify(dto.permissions || '[]'),
      }),
    );

    // Return the plain token (not hashed) so user can copy it
    return { api, token };
  }

  async update(
    id: number,
    dto: Partial<ApplicationApi>,
  ): Promise<ApplicationApi> {
    await this.findOne(id);
    const updateData: any = { ...dto };
    if (updateData.permissions && Array.isArray(updateData.permissions)) {
      updateData.permissions = JSON.stringify(updateData.permissions);
    }
    // Don't allow token update
    delete updateData.token;
    await this.apiRepo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.apiRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('API key not found');
  }

  private generateToken(): string {
    // Generate a token similar to Pterodactyl's ptla_ format
    const prefix = 'zya_';
    const randomPart = randomBytes(32).toString('hex');
    return `${prefix}${randomPart}`;
  }
}
