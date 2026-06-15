import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Server } from '../entities/server.entity';
import { Setting } from '../entities/setting.entity';
import { Transaction } from '../entities/transaction.entity';
import { MailModule } from '../mail/mail.module';
import { PterodactylModule } from '../pterodactyl/pterodactyl.module';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Server, Setting, Transaction]),
    MailModule,
    PterodactylModule,
  ],
  controllers: [DiscordController],
  providers: [DiscordService],
})
export class DiscordModule {}
