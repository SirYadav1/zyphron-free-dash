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
import { IsString, IsOptional, IsArray } from 'class-validator';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

class CreateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  guard_name?: string;

  @IsOptional()
  @IsArray()
  permissions?: string[];

  @IsOptional()
  ticket_accept?: number;

  @IsOptional()
  ticket_reject?: number;

  @IsOptional()
  ticket_chat?: number;

  @IsOptional()
  coin_approve?: number;
}

class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  guard_name?: string;

  @IsOptional()
  @IsArray()
  permissions?: string[];

  @IsOptional()
  ticket_accept?: number;

  @IsOptional()
  ticket_reject?: number;

  @IsOptional()
  ticket_chat?: number;

  @IsOptional()
  coin_approve?: number;
}

class AssignRoleDto {
  @IsString()
  user_id: string;
}

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, AdminGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  async findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Post('seed-permissions')
  async seedPermissions() {
    return this.rolesService.seedPermissions();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Get(':id/users')
  async getUsers(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getUsersWithRole(id);
  }

  @Get('user/:userId')
  async getUserRoles(@Param('userId') userId: string) {
    return this.rolesService.getUserRoles(userId);
  }

  @Post()
  async create(@Body() dto: CreateRoleDto) {
    const { permissions, ...roleDto } = dto;
    return this.rolesService.create(roleDto, permissions);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    const { permissions, ...roleDto } = dto;
    return this.rolesService.update(id, roleDto, permissions);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }

  @Post(':id/assign')
  async assignToUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRoleDto,
  ) {
    return this.rolesService.assignRoleToUser(dto.user_id, id);
  }

  @Delete(':id/assign/:userId')
  async removeFromUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId') userId: string,
  ) {
    return this.rolesService.removeRoleFromUser(userId, id);
  }
}
