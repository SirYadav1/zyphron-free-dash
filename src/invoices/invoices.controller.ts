import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findByUser(@CurrentUser('id') userId: string) {
    return this.invoicesService.findByUser(userId);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAll() {
    return this.invoicesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: string,
  ) {
    // scope to the caller, don't trust an id from the url
    return this.invoicesService.findById(id, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(
    @Body()
    body: {
      user_id?: string;
      payment_id?: number;
      amount?: number;
      tax_amount?: number;
      total_amount?: number;
      currency?: string;
      status?: string;
      due_date?: string;
    },
  ) {
    return this.invoicesService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      status?: string;
      paid_at?: string;
      due_date?: string;
      amount?: number;
      tax_amount?: number;
      total_amount?: number;
    },
  ) {
    return this.invoicesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.invoicesService.remove(id);
  }
}
