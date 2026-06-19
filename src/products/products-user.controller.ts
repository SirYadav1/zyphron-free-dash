import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { PterodactylService } from '../pterodactyl/pterodactyl.service';

@Controller('products')
export class ProductsUserController {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly pterodactylService: PterodactylService,
  ) {}

  @Get()
  async findAll() {
    const products = await this.productRepo.find({
      where: { disabled: 0 },
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
    }));
  }

  @Get('nests/:nestId/eggs')
  async getEggsByNest(@Param('nestId', ParseIntPipe) nestId: number) {
    return this.pterodactylService.getEggsByNest(nestId);
  }
}
