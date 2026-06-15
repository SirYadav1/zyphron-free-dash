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
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

class CreateCouponDto {
  @IsString()
  code: string;

  @IsString()
  type: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  max_uses?: number;

  @IsOptional()
  @IsNumber()
  min_product_price?: number;

  @IsOptional()
  @IsString()
  expires_at?: string;
}

class UpdateCouponDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsNumber()
  max_uses?: number;

  @IsOptional()
  @IsNumber()
  min_product_price?: number;

  @IsOptional()
  @IsString()
  expires_at?: string;
}

@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  async findAll() {
    return this.couponsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.remove(id);
  }
}
