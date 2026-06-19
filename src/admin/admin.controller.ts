import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  Min,
} from 'class-validator';

class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coins?: number;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}

class BanUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

class UpdateSettingDto {
  @IsNotEmpty()
  @IsString()
  value: string;
}

class PterodactylConfigDto {
  @IsNotEmpty()
  @IsString()
  panelUrl: string;

  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  panelType?: string;
}

class CreateTemplateDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  nodeId: number;

  @IsNotEmpty()
  @IsNumber()
  eggId: number;

  @IsNotEmpty()
  @IsNumber()
  nestId: number;

  @IsNotEmpty()
  @IsNumber()
  ramMb: number;

  @IsNotEmpty()
  @IsNumber()
  cpuPercent: number;

  @IsNotEmpty()
  @IsNumber()
  diskMb: number;

  @IsOptional()
  @IsNumber()
  databasesLimit?: number;

  @IsOptional()
  @IsNumber()
  allocationsLimit?: number;

  @IsOptional()
  @IsNumber()
  backupLimit?: number;

  @IsOptional()
  @IsBoolean()
  dedicatedIp?: boolean;

  @IsOptional()
  @IsString()
  dockerImage?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Post('users/:id/ban')
  async banUser(@Param('id') id: string, @Body() dto: BanUserDto, @CurrentUser() admin: any) {
    return this.adminService.banUser(id, dto.reason || '', admin.id);
  }

  @Post('users/:id/unban')
  async unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id);
  }

  @Get('servers/expired')
  async getExpiredServers() {
    return this.adminService.getExpiredServers();
  }

  @Post('servers/:id/delete')
  async deleteServer(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteServer(id);
  }

  @Get('servers/:id/expiry')
  async checkServerExpiry(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.checkServerExpiry(id);
  }

  @Post('servers/check-expired')
  async checkExpiredServers() {
    return this.adminService.checkExpiredServers();
  }

  @Get('templates')
  async getTemplates() {
    return this.adminService.getTemplates();
  }

  @Post('templates')
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.adminService.createTemplate(dto);
  }

  @Put('templates/:id')
  async updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.adminService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteTemplate(id);
  }

  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings/:key')
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
  ) {
    return this.adminService.updateSetting(key, dto.value);
  }

  @Get('pterodactyl/nodes')
  async getNodes() {
    return this.adminService.getPterodactylNodes();
  }

  @Get('pterodactyl/nests')
  async getNests() {
    return this.adminService.getPterodactylNests();
  }

  @Get('pterodactyl/nests/:id/eggs')
  async getEggs(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getPterodactylEggs(id);
  }

  @Get('pterodactyl/config')
  async getPterodactylConfig() {
    return this.adminService.getPterodactylConfig();
  }

  @Put('pterodactyl/config')
  async updatePterodactylConfig(@Body() dto: PterodactylConfigDto) {
    return this.adminService.updatePterodactylConfig(
      dto.panelUrl,
      dto.apiKey,
      dto.panelType,
    );
  }

  @Post('pterodactyl/test')
  async testPterodactylConfig() {
    return this.adminService.testPterodactylConfig();
  }

  @Get('pterodactyl/users')
  async getPterodactylUsers() {
    return this.adminService.getPterodactylUsers();
  }

  @Get('pterodactyl/users/:id')
  async getPterodactylUserDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getPterodactylUserDetail(id);
  }

  @Put('pterodactyl/users/:id')
  async updatePterodactylUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { username?: string; email?: string; first_name?: string; last_name?: string; password?: string },
  ) {
    return this.adminService.updatePterodactylUser(id, dto);
  }

  @Get('pterodactyl/locations')
  async getPterodactylLocations() {
    return this.adminService.getPterodactylLocations();
  }

  @Get('pterodactyl/servers/:id/utilization')
  async getPterodactylServerUtilization(@Param('id') id: string) {
    return this.adminService.getPterodactylServerUtilization(id);
  }

  @Post('pterodactyl/servers/:id/transfer')
  async transferPterodactylServer(
    @Param('id') id: string,
    @Body() dto: { userId: number },
  ) {
    return this.adminService.transferPterodactylServer(id, dto.userId);
  }
}
