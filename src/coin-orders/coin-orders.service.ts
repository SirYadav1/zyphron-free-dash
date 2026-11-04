import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinOrder } from '../entities/coin-order.entity';
import { User } from '../entities/user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class CoinOrdersService {
  private readonly logger = new Logger(CoinOrdersService.name);

  constructor(
    @InjectRepository(CoinOrder)
    private readonly coinOrderRepo: Repository<CoinOrder>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async createOrder(userId: string, dto: {
    package_name: string;
    coins_amount: number;
    price: number;
    currency_code?: string;
    payment_address?: string;
  }) {
    const order = this.coinOrderRepo.create({
      user_id: userId,
      package_name: dto.package_name,
      coins_amount: dto.coins_amount,
      price: dto.price,
      currency_code: dto.currency_code || 'USD',
      status: 'pending',
      payment_address: dto.payment_address || null,
    });
    return this.coinOrderRepo.save(order);
  }

  async getOrder(id: number, userId: string) {
    const order = await this.coinOrderRepo.findOne({
      where: { id, user_id: userId },
      relations: { user: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async uploadScreenshot(orderId: number, userId: string, screenshotPath: string) {
    const order = await this.coinOrderRepo.findOne({
      where: { id: orderId, user_id: userId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'pending') {
      throw new BadRequestException('Order is not in pending status');
    }

    order.screenshot_path = screenshotPath;
    order.status = 'awaiting_screenshot';
    return this.coinOrderRepo.save(order);
  }

  // admin methods
  async getUserOrders(userId: string) {
    return this.coinOrderRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findAllOrders() {
    return this.coinOrderRepo.find({
      relations: { user: true },
      order: { created_at: 'DESC' },
    });
  }

  async getOrderById(id: number) {
    const order = await this.coinOrderRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async approveOrder(id: number, message?: string) {
    const order = await this.getOrderById(id);
    if (order.status !== 'awaiting_screenshot') {
      throw new BadRequestException('Order must have a screenshot uploaded before approval');
    }

    const amount = Number(order.coins_amount) || 0;

    // credit coins first with a guarded relative-style update, THEN flip the
    // status atomically — closes the double-approve / lost-update race (C5).
    // If another admin approved first, we roll our credit back.
    let credited = false;
    if (amount > 0) {
      for (let attempt = 0; attempt < 3 && !credited; attempt++) {
        const currentUser = await this.userRepo.findOne({
          where: { id: order.user_id },
          select: { id: true, coins: true },
        });
        if (!currentUser) break;

        const creditResult = await this.userRepo
          .createQueryBuilder()
          .update(User)
          .set({ coins: currentUser.coins + amount })
          .where('id = :id AND coins = :coins', {
            id: currentUser.id,
            coins: currentUser.coins,
          })
          .execute();

        if (creditResult.affected) {
          credited = true;
        }
      }

      if (!credited) {
        this.logger.error(
          `Failed to credit ${amount} coins for order ${id} after 3 attempts — aborting approval`,
        );
        throw new BadRequestException('Could not credit coins, please try again');
      }
    }

    const flip = await this.coinOrderRepo
      .createQueryBuilder()
      .update(CoinOrder)
      .set({ status: 'approved', admin_message: message || null })
      .where('id = :id AND status = :status', {
        id,
        status: 'awaiting_screenshot',
      })
      .execute();

    if (!flip.affected) {
      // lost the race — another admin already approved. undo our credit.
      if (credited) {
        await this.userRepo
          .createQueryBuilder()
          .update(User)
          .set({ coins: () => `coins - ${amount}` })
          .where('id = :id', { id: order.user_id })
          .execute();
      }
      throw new BadRequestException('Order already processed');
    }

    // send payment approved email
    const user = await this.userRepo.findOne({ where: { id: order.user_id } });
    if (user?.email) {
      try {
        await this.mailService.sendPaymentApproved(
          user.email,
          user.username,
          order.coins_amount,
          order.id,
          user.first_name || user.username,
        );
      } catch (error) {
        this.logger.warn(`Failed to send payment approved email to ${user.email}:`, error.message);
      }
    }

    return this.getOrderById(id);
  }

  async declineOrder(id: number, message?: string) {
    const order = await this.getOrderById(id);
    // set status back to 'pending' so user can re-upload screenshot
    order.status = 'pending';
    order.admin_message = message || null;
    // clear screenshot so user can upload a new one
    order.screenshot_path = null;
    return this.coinOrderRepo.save(order);
  }

  async sendMessage(id: number, message: string) {
    const order = await this.getOrderById(id);
    order.admin_message = message;
    return this.coinOrderRepo.save(order);
  }

  async getPendingCount() {
    return this.coinOrderRepo.count({
      where: { status: 'awaiting_screenshot' },
    });
  }
}
