import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { UsefulLinksService } from './useful-links.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

class CreateUsefulLinkDto {
  @IsString()
  title: string;

  @IsString()
  link: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  position?: string;
}

class UpdateUsefulLinkDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  position?: string;
}

@Controller('admin/useful-links')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsefulLinksController {
  constructor(private readonly usefulLinksService: UsefulLinksService) {}

  @Get()
  async findAll() {
    return this.usefulLinksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usefulLinksService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateUsefulLinkDto) {
    return this.usefulLinksService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsefulLinkDto,
  ) {
    return this.usefulLinksService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usefulLinksService.remove(id);
  }
}
