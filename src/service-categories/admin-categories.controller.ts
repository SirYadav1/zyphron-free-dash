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
import { ServiceCategoriesService } from './service-categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsString()
  sub_image_url?: string;

  @IsOptional()
  @IsNumber()
  display_order?: number;

  @IsOptional()
  @IsNumber()
  is_active?: number;
}

class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsString()
  sub_image_url?: string;

  @IsOptional()
  @IsNumber()
  display_order?: number;

  @IsOptional()
  @IsNumber()
  is_active?: number;
}

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCategoriesController {
  constructor(
    private readonly categoriesService: ServiceCategoriesService,
  ) {}

  @Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
