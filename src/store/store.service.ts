import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../entities/server.entity';
import { User } from '../entities/user.entity';
import { Setting } from '../entities/setting.entity';
import { Transaction } from '../entities/transaction.entity';
import { ShopProduct } from '../entities/shop-product.entity';
import { PterodactylService } from '../pterodactyl/pterodactyl.service';

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(
    @InjectRepository(Server) private serverRepo: Repository<Server>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(ShopProduct)
    private readonly shopProductRepo: Repository<ShopProduct>,
    private pterodactylService: PterodactylService,
  ) {}

  private async getSetting(key: string, defaultValue: string): Promise<string> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    return setting?.value || defaultValue;
  }

  async getUpgradeOptions(serverId: number, userId: string): Promise<any> {
    const server = await this.serverRepo.findOne({
      where: { id: serverId, user_id: userId },
      relations: { template: true },
    });

    if (!server) throw new NotFoundException('Server not found');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const template = server.template;

    const ramPerMb = parseInt(await this.getSetting('ram_cost_per_mb', '2'));
    const cpuPerPercent = parseInt(await this.getSetting('cpu_cost_per_percent', '5'));
    const diskPerMb = parseInt(await this.getSetting('disk_cost_per_mb', '1'));
    const renewalCost = parseInt(await this.getSetting('renewal_coins', '50'));

    return {
      server: {
        id: server.id,
        name: server.server_name,
        status: server.status,
        expiresAt: server.expires_at,
        ram: {
          current: server.ram_mb,
          base: template?.ram_mb || server.ram_mb,
        },
        cpu: {
          current: server.cpu_percent,
          base: template?.cpu_percent || server.cpu_percent,
        },
        disk: {
          current: server.disk_mb,
          base: template?.disk_mb || server.disk_mb,
        },
      },
      pricing: {
        ramPerMb: ramPerMb,
        cpuPerPercent: cpuPerPercent,
        diskPerMb: diskPerMb,
        renewal: renewalCost,
        renewalDays: parseInt(
          await this.getSetting('server_validity_days', '7'),
        ),
      },
      user: {
        coins: user.coins,
      },
    };
  }

  async upgradeServer(
    serverId: number,
    userId: string,
    type: string,
    amount: number,
  ): Promise<any> {
    const server = await this.serverRepo.findOne({
      where: { id: serverId, user_id: userId },
    });
    if (!server) throw new NotFoundException('Server not found');

    if (server.status !== 'active') {
      throw new BadRequestException('Server is not active. Renew it first.');
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const costPerUnit = parseInt(
      type === 'ram'
        ? await this.getSetting('ram_cost_per_mb', '2')
        : type === 'cpu'
          ? await this.getSetting('cpu_cost_per_percent', '5')
          : await this.getSetting('disk_cost_per_mb', '1'),
    );

    let currentValue: number;
    let field: 'ram_mb' | 'cpu_percent' | 'disk_mb';

    switch (type) {
      case 'ram':
        currentValue = server.ram_mb;
        field = 'ram_mb';
        break;
      case 'cpu':
        currentValue = server.cpu_percent;
        field = 'cpu_percent';
        break;
      case 'disk':
        currentValue = server.disk_mb;
        field = 'disk_mb';
        break;
      default:
        throw new BadRequestException(
          'Invalid upgrade type. Use ram, cpu, or disk.',
        );
    }

    const totalCost = amount * costPerUnit;
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.coins < totalCost) {
      throw new BadRequestException(
        `Not enough coins. You need ${totalCost} but have ${user.coins}.`,
      );
    }

    const updateResult = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ coins: user.coins - totalCost })
      .where('id = :id AND coins = :coins', { id: userId, coins: user.coins })
      .execute();

    if (updateResult.affected === 0) {
      throw new BadRequestException(
        'Failed to deduct coins. Please try again.',
      );
    }

    const newValue = currentValue + amount;

    try {
      await this.pterodactylService.updateServerBuild(
        server.pterodactyl_server_id || '',
        {
          memory: type === 'ram' ? newValue : undefined,
          cpu: type === 'cpu' ? newValue : undefined,
          disk: type === 'disk' ? newValue : undefined,
        },
      );
    } catch (error) {
      this.logger.error('Failed to update Pterodactyl server build:', error);
      const freshUserForRefund = await this.userRepo.findOne({ where: { id: userId } });
      if (freshUserForRefund) {
        const refundCoins = freshUserForRefund.coins + totalCost;
        await this.userRepo
          .createQueryBuilder()
          .update(User)
          .set({ coins: refundCoins })
          .where('id = :id AND coins = :coins', { id: userId, coins: freshUserForRefund.coins })
          .execute();
        this.logger.log(`Refunded ${totalCost} coins to user ${userId} (now ${refundCoins})`);
      }
      throw new BadRequestException('Failed to update server on panel. Coins refunded.');
    }

    await this.serverRepo.update(serverId, { [field]: newValue });

    await this.transactionRepo.save(
      this.transactionRepo.create({
        user_id: userId,
        type: 'spend',
        amount: -totalCost,
        description: `Upgraded ${type.toUpperCase()} by ${amount} (${field}: ${currentValue} → ${newValue})`,
      }),
    );

    return {
      message: `${type.toUpperCase()} upgraded by ${amount}`,
      cost: totalCost,
      remainingCoins: (await this.userRepo.findOne({ where: { id: userId } }))?.coins ?? (user.coins - totalCost),  // re-read the balance, the cached value is stale
      server: {
        [field]: newValue,
      },
    };
  }

  async renewServer(serverId: number, userId: string): Promise<any> {
    const server = await this.serverRepo.findOne({
      where: { id: serverId, user_id: userId },
    });
    if (!server) throw new NotFoundException('Server not found');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const renewalCost = parseInt(await this.getSetting('renewal_coins', '50'));
    const renewalDays = parseInt(
      await this.getSetting('server_validity_days', '7'),
    );

    if (user.coins < renewalCost) {
      throw new BadRequestException(
        `Not enough coins. Renewal costs ${renewalCost} coins but you have ${user.coins}.`,
      );
    }

    const updateResult = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ coins: user.coins - renewalCost })
      .where('id = :id AND coins = :coins', { id: userId, coins: user.coins })
      .execute();

    if (updateResult.affected === 0) {
      throw new BadRequestException(
        'Failed to deduct coins. Please try again.',
      );
    }

    const now = new Date();
    const currentExpiry = server.expires_at ? new Date(server.expires_at) : now;
    let newExpiryDate: Date;

    if (currentExpiry < now) {
      newExpiryDate = new Date(now);
      newExpiryDate.setDate(newExpiryDate.getDate() + renewalDays);
    } else {
      newExpiryDate = new Date(currentExpiry);
      newExpiryDate.setDate(newExpiryDate.getDate() + renewalDays);
    }

    let newStatus = server.status;
    if (server.status === 'expired' || server.status === 'suspended') {
      newStatus = 'active';
      if (server.pterodactyl_server_id) {
        try {
          await this.pterodactylService.unsuspendServer(
            server.pterodactyl_server_id,
          );
        } catch (error) {
          this.logger.error('Failed to unsuspend via Pterodactyl API:', error);
        }
      }
    }

    await this.serverRepo.update(serverId, {
      expires_at: newExpiryDate.toISOString(),
      status: newStatus,
    });

    await this.transactionRepo.save(
      this.transactionRepo.create({
        user_id: userId,
        type: 'renewal',
        amount: -renewalCost,
        description: `Renewed server "${server.server_name}" for ${renewalDays} days`,
      }),
    );

    return {
      message: `Server renewed until ${newExpiryDate.toLocaleDateString()}`,
      cost: renewalCost,
      remainingCoins: user.coins - renewalCost,
      expiresAt: newExpiryDate,
    };
  }

  async findAllShopProducts(): Promise<any[]> {
    return this.shopProductRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOneShopProduct(id: number): Promise<any> {
    const product = await this.shopProductRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Shop product not found');
    return product;
  }

  async createShopProduct(dto: Partial<ShopProduct>): Promise<ShopProduct> {
    return this.shopProductRepo.save(this.shopProductRepo.create(dto));
  }

  async updateShopProduct(
    id: number,
    dto: Partial<ShopProduct>,
  ): Promise<ShopProduct> {
    await this.findOneShopProduct(id);
    await this.shopProductRepo.update(id, dto);
    return this.findOneShopProduct(id);
  }

  async removeShopProduct(id: number): Promise<void> {
    const result = await this.shopProductRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Shop product not found');
  }
}
