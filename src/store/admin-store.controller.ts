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
import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

class CreateShopProductDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsString()
  description: string;

  @IsString()
  display: string;

  @IsOptional()
  @IsString()
  currency_code?: string;

  @IsOptional()
  @IsNumber()
  disabled?: number;
}

class UpdateShopProductDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  display?: string;

  @IsOptional()
  @IsString()
  currency_code?: string;

  @IsOptional()
  @IsNumber()
  disabled?: number;
}

@Controller('admin/store')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminStoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  async findAll() {
    return this.storeService.findAllShopProducts();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.findOneShopProduct(id);
  }

  @Post()
  async create(@Body() dto: CreateShopProductDto) {
    return this.storeService.createShopProduct(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShopProductDto,
  ) {
    return this.storeService.updateShopProduct(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.removeShopProduct(id);
  }
}
