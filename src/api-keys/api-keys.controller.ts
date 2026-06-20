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
import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

class CreateApiKeyDto {
  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsArray()
  permissions?: string[];

  @IsOptional()
  @IsString()
  ip_whitelist?: string;

  @IsOptional()
  @IsNumber()
  rate_limit?: number;
}

@Controller('admin/api')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async findAll() {
    return this.apiKeysService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.apiKeysService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateApiKeyDto) {
    const permissions = dto.permissions ? JSON.stringify(dto.permissions) : '[]';
    const result = await this.apiKeysService.create({ ...dto, permissions } as any);
    
    // return the API key with the plain token (not hashed)
    return {
      id: result.api.id,
      memo: result.api.memo,
      token: result.token, // Plain token, not hashed
      permissions: result.api.permissions,
      ip_whitelist: result.api.ip_whitelist,
      rate_limit: result.api.rate_limit,
      is_active: result.api.is_active,
      created_at: result.api.created_at,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateApiKeyDto,
  ) {
    const permissions = dto.permissions ? JSON.stringify(dto.permissions) : undefined;
    return this.apiKeysService.update(id, { ...dto, permissions } as any);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.apiKeysService.remove(id);
  }

  @Get('permissions/list')
  async getPermissions() {
    const { PERMISSIONS } = require('../common/guards/api-key.guard');
    return PERMISSIONS;
  }
}
