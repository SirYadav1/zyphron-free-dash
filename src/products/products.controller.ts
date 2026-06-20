import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { PterodactylService } from '../pterodactyl/pterodactyl.service';

class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  billing_priority?: string;

  @IsOptional()
  @IsNumber()
  cpu?: number;

  @IsOptional()
  @IsNumber()
  ram?: number;

  @IsOptional()
  @IsNumber()
  swap?: number;

  @IsOptional()
  @IsNumber()
  disk?: number;

  @IsOptional()
  @IsNumber()
  databases?: number;

  @IsOptional()
  @IsNumber()
  backups?: number;

  @IsOptional()
  @IsNumber()
  oom_killer?: number;

  @IsOptional()
  @IsNumber()
  allocations?: number;

  @IsOptional()
  @IsNumber()
  server_limit?: number;

  @IsOptional()
  @IsNumber()
  disabled?: number;

  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsOptional()
  @IsNumber()
  nest_id?: number;

  @IsOptional()
  @IsNumber()
  egg_id?: number;

  @IsOptional()
  @IsNumber()
  duration_days?: number;

  @IsOptional()
  @IsString()
  egg_name?: string;

  @IsOptional()
  @IsString()
  nest_name?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsNumber()
  coin_price?: number;

  @IsOptional()
  @IsNumber()
  category_id?: number;
}

class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  billing_priority?: string;

  @IsOptional()
  @IsNumber()
  cpu?: number;

  @IsOptional()
  @IsNumber()
  ram?: number;

  @IsOptional()
  @IsNumber()
  swap?: number;

  @IsOptional()
  @IsNumber()
  disk?: number;

  @IsOptional()
  @IsNumber()
  databases?: number;

  @IsOptional()
  @IsNumber()
  backups?: number;

  @IsOptional()
  @IsNumber()
  oom_killer?: number;

  @IsOptional()
  @IsNumber()
  allocations?: number;

  @IsOptional()
  @IsNumber()
  server_limit?: number;

  @IsOptional()
  @IsNumber()
  disabled?: number;

  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsOptional()
  @IsNumber()
  nest_id?: number;

  @IsOptional()
  @IsNumber()
  egg_id?: number;

  @IsOptional()
  @IsNumber()
  duration_days?: number;

  @IsOptional()
  @IsString()
  egg_name?: string;

  @IsOptional()
  @IsString()
  nest_name?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsNumber()
  coin_price?: number;

  @IsOptional()
  @IsNumber()
  category_id?: number;
}

@Controller('admin/products')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly pterodactylService: PterodactylService,
  ) {}

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  @Get('nests')
  async getNests() {
    return this.pterodactylService.getNests();
  }

  @Get('nests/:nestId/eggs')
  async getEggs(@Param('nestId', ParseIntPipe) nestId: number) {
    return this.pterodactylService.getEggsByNest(nestId);
  }

  @Get('nodes')
  async getNodes() {
    return this.pterodactylService.getNodes();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
