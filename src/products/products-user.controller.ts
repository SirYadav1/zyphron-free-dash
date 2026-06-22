import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { PterodactylService } from '../pterodactyl/pterodactyl.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
      category_id: p.category_id,
      image_url: p.image_url,
    }));
  }

  // BUG-H4 FIX: Added JwtAuthGuard to prevent unauthenticated access to Pterodactyl panel structure
  @Get('nests/:nestId/eggs')
  @UseGuards(JwtAuthGuard)
  async getEggsByNest(@Param('nestId', ParseIntPipe) nestId: number) {
    return this.pterodactylService.getEggsByNest(nestId);
  }
}
