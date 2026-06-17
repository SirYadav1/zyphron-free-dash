import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from '../entities/server.entity';
import { Setting } from '../entities/setting.entity';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';
import { ShopProduct } from '../entities/shop-product.entity';
import { Product } from '../entities/product.entity';
import { Invoice } from '../entities/invoice.entity';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { AdminServersController } from './admin-servers.controller';
import { ServerLifecycleService } from './server-lifecycle.service';
import { ServerRenewalService } from './server-renewal.service';
import { ServerRenewalController } from './server-renewal.controller';
import { PterodactylModule } from '../pterodactyl/pterodactyl.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Server, Setting, User, Transaction, ShopProduct, Product, Invoice]),
    PterodactylModule,
    MailModule,
    ActivityLogsModule,
  ],
  controllers: [ServersController, AdminServersController, ServerRenewalController],
  providers: [ServersService, ServerLifecycleService, ServerRenewalService],
  exports: [ServersService, ServerLifecycleService, ServerRenewalService],
})
export class ServersModule {}
