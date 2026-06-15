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
import { VouchersService } from './vouchers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

class CreateVoucherDto {
  @IsString()
  code: string;

  @IsNumber()
  credits: number;

  @IsOptional()
  @IsNumber()
  uses?: number;

  @IsOptional()
  @IsString()
  expires_at?: string;
}

class UpdateVoucherDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsNumber()
  credits?: number;

  @IsOptional()
  @IsNumber()
  uses?: number;

  @IsOptional()
  @IsString()
  expires_at?: string;
}

@Controller('admin/vouchers')
@UseGuards(JwtAuthGuard, AdminGuard)
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  async findAll() {
    return this.vouchersService.findAll();
  }

  @Get(':id/users')
  async getUsers(@Param('id', ParseIntPipe) id: number) {
    return this.vouchersService.getUsers(id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vouchersService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateVoucherDto) {
    return this.vouchersService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVoucherDto,
  ) {
    return this.vouchersService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.vouchersService.remove(id);
  }
}
