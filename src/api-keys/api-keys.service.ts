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

  // store the hash only, the token is shown once on create
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async findAll(): Promise<ApplicationApi[]> {
    return this.apiRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: number): Promise<ApplicationApi> {
    const api = await this.apiRepo.findOne({ where: { id } });
    if (!api) throw new NotFoundException('API key not found');
    return api;
  }

  async create(dto: Partial<ApplicationApi>): Promise<{ api: ApplicationApi; token: string }> {
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);
    
    const api = await this.apiRepo.save(
      this.apiRepo.create({
        ...dto,
        token: tokenHash,
        permissions: typeof dto.permissions === 'string' ? dto.permissions : JSON.stringify(dto.permissions || '[]'),
      }),
    );

    // return plain token once (only time user sees it)
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
    // don't allow token update
    delete updateData.token;
    await this.apiRepo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.apiRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('API key not found');
  }

  // compare hashes, never the raw token
  async verifyToken(plainToken: string): Promise<ApplicationApi | null> {
    const hash = this.hashToken(plainToken);
    const api = await this.apiRepo.findOne({ where: { token: hash } });
    return api || null;
  }

  private generateToken(): string {
    const prefix = 'zya_';
    const randomPart = randomBytes(32).toString('hex');
    return `${prefix}${randomPart}`;
  }
}
