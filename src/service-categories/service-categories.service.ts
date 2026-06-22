import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategory } from '../entities/service-category.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class ServiceCategoriesService {
  constructor(
    @InjectRepository(ServiceCategory)
    private readonly categoryRepo: Repository<ServiceCategory>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(): Promise<any[]> {
    const categories = await this.categoryRepo.find({
      order: { display_order: 'ASC', name: 'ASC' },
    });

    // Attach product count to each category
    const result = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await this.productRepo.count({
          where: { category_id: cat.id },
        });
        return { ...cat, product_count: productCount };
      }),
    );

    return result;
  }

  async findActive(): Promise<any[]> {
    const categories = await this.categoryRepo.find({
      where: { is_active: 1 },
      order: { display_order: 'ASC', name: 'ASC' },
    });

    // Attach product count to each category
    const result = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await this.productRepo.count({
          where: { category_id: cat.id, disabled: 0 },
        });
        return { ...cat, product_count: productCount };
      }),
    );

    return result;
  }

  async findOne(id: number): Promise<ServiceCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findCategoryProducts(categoryId: number): Promise<any[]> {
    await this.findOne(categoryId); // ensure category exists
    const products = await this.productRepo.find({
      where: { category_id: categoryId, disabled: 0 },
      order: { sort_order: 'ASC', coin_price: 'ASC' },
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      coin_price: p.coin_price,
      duration_days: p.duration_days,
      ram: p.ram,
      cpu: p.cpu,
      disk: p.disk,
      swap: p.swap,
      databases: p.databases,
      backups: p.backups,
      allocations: p.allocations,
      egg_name: p.egg_name,
      nest_name: p.nest_name,
      nest_id: p.nest_id,
      egg_id: p.egg_id,
      category_id: p.category_id,
      image_url: p.image_url,
      disabled: p.disabled,
    }));
  }

  async create(dto: Partial<ServiceCategory>): Promise<ServiceCategory> {
    return this.categoryRepo.save(this.categoryRepo.create(dto));
  }

  async update(
    id: number,
    dto: Partial<ServiceCategory>,
  ): Promise<ServiceCategory> {
    await this.findOne(id);
    await this.categoryRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.categoryRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Category not found');
  }
}
