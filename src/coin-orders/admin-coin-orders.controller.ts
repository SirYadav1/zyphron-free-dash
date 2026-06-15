import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { CoinOrdersService } from './coin-orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

class ApproveOrderDto {
  @IsOptional()
  @IsString()
  message?: string;
}

class DeclineOrderDto {
  @IsOptional()
  @IsString()
  message?: string;
}

class SendMessageDto {
  @IsString()
  message: string;
}

@Controller('admin/coin-orders')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCoinOrdersController {
  constructor(private readonly coinOrdersService: CoinOrdersService) {}

  @Get()
  async findAll() {
    return this.coinOrdersService.findAllOrders();
  }

  @Get('pending-count')
  async getPendingCount() {
    const count = await this.coinOrdersService.getPendingCount();
    return { count };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coinOrdersService.getOrderById(id);
  }

  @Post(':id/approve')
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveOrderDto,
  ) {
    return this.coinOrdersService.approveOrder(id, dto.message);
  }

  @Post(':id/decline')
  async decline(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeclineOrderDto,
  ) {
    return this.coinOrdersService.declineOrder(id, dto.message);
  }

  @Post(':id/message')
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.coinOrdersService.sendMessage(id, dto.message);
  }
}
