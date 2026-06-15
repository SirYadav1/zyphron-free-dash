import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Server } from '../entities/server.entity';
import { Setting } from '../entities/setting.entity';
import { Transaction } from '../entities/transaction.entity';
import { ServerTemplate } from '../entities/server-template.entity';
import { PanelConfig } from '../entities/panel-config.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MailModule } from '../mail/mail.module';
import { PterodactylModule } from '../pterodactyl/pterodactyl.module';
import { ServersModule } from '../servers/servers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Server,
      Setting,
      Transaction,
      ServerTemplate,
      PanelConfig,
    ]),
    MailModule,
    PterodactylModule,
    ServersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
