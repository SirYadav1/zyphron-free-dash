import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { CoinOrdersService } from './coin-orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class CreateCoinOrderDto {
  @IsString()
  package_name: string;

  @IsNumber()
  coins_amount: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  currency_code?: string;

  @IsOptional()
  @IsString()
  payment_address?: string;
}

class UploadScreenshotDto {
  @IsString()
  screenshot_url: string;
}

@Controller('coin-orders')
@UseGuards(JwtAuthGuard)
export class CoinOrdersController {
  constructor(private readonly coinOrdersService: CoinOrdersService) {}

  @Post()
  async createOrder(
    @Body() dto: CreateCoinOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.coinOrdersService.createOrder(user.id, dto);
  }

  @Get('list')
  async getMyOrders(@CurrentUser() user: any) {
    return this.coinOrdersService.getUserOrders(user.id);
  }

  @Get(':id')
  async getOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.coinOrdersService.getOrder(id, user.id);
  }

  @Post(':id/screenshot')
  async uploadScreenshot(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UploadScreenshotDto,
    @CurrentUser() user: any,
  ) {
    return this.coinOrdersService.uploadScreenshot(id, user.id, dto.screenshot_url);
  }
}
