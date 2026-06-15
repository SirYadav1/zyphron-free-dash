import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class AdminReplyDto {
  @IsString()
  @IsNotEmpty()
  comment: string;
}

class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

class AddBlacklistDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

@Controller('admin/tickets')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  async getAllTickets() {
    return this.ticketsService.getAllTickets();
  }

  @Get('categories')
  async getCategories() {
    return this.ticketsService.getCategories();
  }

  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.ticketsService.createCategory(dto.name);
  }

  @Get('blacklist')
  async getBlacklist() {
    return this.ticketsService.getBlacklist();
  }

  @Post('blacklist')
  async addBlacklistEntry(@Body() dto: AddBlacklistDto) {
    return this.ticketsService.addBlacklistEntry(dto.type, dto.value);
  }

  @Delete('blacklist/:id')
  async removeBlacklistEntry(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.removeBlacklistEntry(id);
  }

  @Get(':id')
  async getTicket(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.getTicket(id);
  }

  @Post(':id/reply')
  async adminReply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminReplyDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.addComment(user.id, id, dto.comment, true);
  }

  @Post(':id/close')
  async closeTicket(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.closeTicket(id);
  }
}
