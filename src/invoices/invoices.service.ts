import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { User } from '../entities/user.entity';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async generateInvoiceNumber(): Promise<string> {
    const count = await this.invoiceRepo.count();
    const seq = (count + 1).toString().padStart(5, '0');
    const year = new Date().getFullYear();
    return `INV-${year}-${seq}`;
  }

  async findByUser(userId: string): Promise<Invoice[]> {
    return this.invoiceRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      relations: { payment: true },
    });
  }

  async findById(id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: { user: true, payment: true },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice #${id} not found`);
    }
    return invoice;
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepo.find({
      order: { created_at: 'DESC' },
      relations: { user: true, payment: true },
    });
  }

  async create(data: {
    user_id?: string;
    payment_id?: number;
    amount?: number;
    tax_amount?: number;
    total_amount?: number;
    currency?: string;
    status?: string;
    due_date?: string;
  }): Promise<Invoice> {
    const invoice_number = await this.generateInvoiceNumber();
    const invoice = this.invoiceRepo.create({
      ...data,
      invoice_number,
    });
    return this.invoiceRepo.save(invoice);
  }

  async update(
    id: number,
    data: Partial<Pick<Invoice, 'status' | 'paid_at' | 'due_date' | 'amount' | 'tax_amount' | 'total_amount'>>,
  ): Promise<Invoice> {
    const invoice = await this.findById(id);
    if (data.status === 'paid' && !invoice.paid_at) {
      data.paid_at = new Date().toISOString();
    }
    Object.assign(invoice, data);
    return this.invoiceRepo.save(invoice);
  }

  async remove(id: number): Promise<void> {
    const invoice = await this.findById(id);
    await this.invoiceRepo.remove(invoice);
  }
}
