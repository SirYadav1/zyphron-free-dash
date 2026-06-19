import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Transaction } from '../entities/transaction.entity';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class EconomyController {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
  ) {}

  @Get()
  async getTransactions(@CurrentUser() user: any) {
    const data = await this.transactionRepo.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
      take: 100,
    });

    return (data || []).map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      createdAt: tx.created_at,
    }));
  }
}
