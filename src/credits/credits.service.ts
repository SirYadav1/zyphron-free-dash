import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopProduct } from '../entities/shop-product.entity';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(ShopProduct)
    private readonly shopProductRepo: Repository<ShopProduct>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  async getCreditPackages(): Promise<any[]> {
    const packages = await this.shopProductRepo.find({
      where: { type: 'credit_package', disabled: 0 },
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

    // Simulate payment - in production this would integrate with a payment gateway
    // For now, just add coins to the user's account
    const creditAmount = pkg.quantity;

    // BUG-C3 FIX: Add optimistic locking to prevent double-credit exploit
    const updateResult = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ coins: user.coins + creditAmount })
      .where('id = :id AND coins = :coins', { id: userId, coins: user.coins })
      .execute();

    if (updateResult.affected === 0) {
      throw new BadRequestException('Concurrent purchase detected. Please try again.');
    }

    // Record transaction
    await this.transactionRepo.save(
      this.transactionRepo.create({
        user_id: userId,
        type: 'credit_purchase',
        amount: creditAmount,
        description: `Purchased ${creditAmount} credits (${pkg.display})`,
      }),
    );

    const updatedUser = await this.userRepo.findOne({ where: { id: userId } });

    return {
      message: `Successfully purchased ${creditAmount} credits`,
      creditsAdded: creditAmount,
      totalCredits: updatedUser?.coins || 0,
    };
  }
}
