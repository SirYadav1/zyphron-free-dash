import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopProduct } from '../entities/shop-product.entity';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';
import { Invoice } from '../entities/invoice.entity';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(ShopProduct)
    private readonly shopProductRepo: Repository<ShopProduct>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async getCreditPackages(): Promise<any[]> {
    const packages = await this.shopProductRepo.find({
      where: { type: 'credits', disabled: 0 },
      order: { price: 'ASC' },
    });
    return packages.map((pkg) => ({
      id: pkg.id,
      display: pkg.display,
      description: pkg.description,
      price: pkg.price,
      currency_code: pkg.currency_code,
      quantity: pkg.quantity,
    }));
  }

  async buyCredits(userId: string, packageId: number): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const pkg = await this.shopProductRepo.findOne({ where: { id: packageId } });
    if (!pkg) throw new NotFoundException('Credit package not found');
    if (pkg.disabled) throw new BadRequestException('This package is currently unavailable');

    // simulate payment - in production this would integrate with a payment gateway
    // for now, just add coins to the user's account
    const creditAmount = pkg.quantity;

    // optimistic lock, closes the double-credit race
    const updateResult = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ coins: user.coins + creditAmount })
      .where('id = :id AND coins = :coins', { id: userId, coins: user.coins })
      .execute();

    if (updateResult.affected === 0) {
      throw new BadRequestException('Concurrent purchase detected. Please try again.');
    }

    // record transaction
    await this.transactionRepo.save(
      this.transactionRepo.create({
        user_id: userId,
        type: 'credit_purchase',
        amount: creditAmount,
        description: `Purchased ${creditAmount} credits (${pkg.display})`,
      }),
    );

    // generate invoice for the purchase
    const now = new Date();
    const timestamp = now.getTime().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNumber = `INV-${now.getFullYear()}-${timestamp}-${random}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    await this.invoiceRepo.save(
      this.invoiceRepo.create({
        user_id: userId,
        invoice_number: invoiceNumber,
        amount: pkg.price || 0,
        tax_amount: 0,
        total_amount: pkg.price || 0,
        currency: pkg.currency_code || 'USD',
        status: 'paid',
        paid_at: now.toISOString(),
        due_date: dueDate.toISOString(),
      }),
    );

    // log activity
    await this.activityLogsService.create({
      log_name: 'credit_purchase',
      description: `User ${user.username || user.email} purchased ${creditAmount} credits (${pkg.display}) for ${pkg.currency_code || 'USD'} ${pkg.price || 0}`,
      subject_type: 'ShopProduct',
      subject_id: pkg.id,
      event: 'credit_purchased',
      causer_type: 'User',
      causer_id: userId,
      properties: {
        credits_added: creditAmount,
        package_display: pkg.display,
        price: pkg.price,
        currency: pkg.currency_code,
      },
    });

    const updatedUser = await this.userRepo.findOne({ where: { id: userId } });

    return {
      message: `Successfully purchased ${creditAmount} credits`,
      creditsAdded: creditAmount,
      totalCredits: updatedUser?.coins || 0,
      invoiceNumber,
    };
  }
}
