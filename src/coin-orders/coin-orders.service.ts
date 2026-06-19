import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinOrder } from '../entities/coin-order.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class CoinOrdersService {
  constructor(
    @InjectRepository(CoinOrder)
    private readonly coinOrderRepo: Repository<CoinOrder>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

  // Admin methods
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

    // Credit coins to user
    const user = await this.userRepo.findOne({ where: { id: order.user_id } });
    if (user) {
      user.coins += order.coins_amount;
      await this.userRepo.save(user);
    }

    order.status = 'approved';
    order.admin_message = message || null;
    return this.coinOrderRepo.save(order);
  }

  async declineOrder(id: number, message?: string) {
    const order = await this.getOrderById(id);
    order.status = 'declined';
    order.admin_message = message || null;
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
