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
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

class CreatePartnerDto {
  @IsString()
  user_id: string;

  @IsOptional()
  @IsNumber()
  partner_discount?: number;

  @IsOptional()
  @IsNumber()
  registered_user_discount?: number;
}

class UpdatePartnerDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsNumber()
  partner_discount?: number;

  @IsOptional()
  @IsNumber()
  registered_user_discount?: number;
}

@Controller('admin/partners')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  async findAll() {
    return this.partnersService.findAll();
  }

  @Get(':id/users')
  async getUsers(@Param('id', ParseIntPipe) id: number) {
    return this.partnersService.getUsers(id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partnersService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreatePartnerDto) {
    return this.partnersService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePartnerDto,
  ) {
    return this.partnersService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.partnersService.remove(id);
  }
}
