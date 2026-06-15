import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class CreateTicketDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  server?: string;
}

class AddCommentDto {
  @IsString()
  message: string;
}

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  async getUserTickets(@CurrentUser() user: any) {
    return this.ticketsService.getUserTickets(user.id);
  }

  @Post()
  async createTicket(@Body() dto: CreateTicketDto, @CurrentUser() user: any) {
    return this.ticketsService.createTicket(user.id, dto);
  }

  @Get(':id')
  async getTicket(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.getTicket(id, user.id);
  }

  @Post(':id/reply')
  async addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.addComment(user.id, id, dto.message, false);
  }

  @Post(':id/close')
  async closeTicket(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.closeTicket(id, user.id);
  }
}
