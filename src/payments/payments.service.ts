import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { Invoice } from '../entities/invoice.entity';
import { User } from '../entities/user.entity';
import { ShopProduct } from '../entities/shop-product.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(ShopProduct)
    private readonly productRepo: Repository<ShopProduct>,
  ) {}

  async findAll(): Promise<any[]> {
    return this.paymentRepo.find({
      order: { created_at: 'DESC' },
      relations: { user: true, shop_product: true },
    });
  }
}
