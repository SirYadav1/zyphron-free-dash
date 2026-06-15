import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Setting } from '../entities/setting.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  private async getSetting(key: string, defaultValue: string): Promise<string> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    return setting?.value || defaultValue;
  }

  async findAll(): Promise<any[]> {
    return this.productRepo.find({ order: { sort_order: 'ASC', name: 'ASC' } });
  }

  async findEnabled(): Promise<any[]> {
    return this.productRepo.find({ where: { disabled: 0 }, order: { sort_order: 'ASC', name: 'ASC' } });
  }

  async findOne(id: number): Promise<any> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: Partial<Product>): Promise<Product> {
    return this.productRepo.save(this.productRepo.create(dto));
  }

  async update(id: number, dto: Partial<Product>): Promise<Product> {
    await this.findOne(id);
    await this.productRepo.update(id, dto);
    return this.findOne(id) as Promise<Product>;
  }

  async remove(id: number): Promise<void> {
    const result = await this.productRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Product not found');
  }
}
