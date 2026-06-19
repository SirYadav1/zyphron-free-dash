import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { PterodactylModule } from './pterodactyl/pterodactyl.module';
import { DiscordModule } from './discord/discord.module';
import { ServersModule } from './servers/servers.module';
import { AfkModule } from './afk/afk.module';
import { StoreModule } from './store/store.module';
import { AdminModule } from './admin/admin.module';
import { EconomyModule } from './economy/economy.module';
import { AchievementsModule } from './achievements/achievements.module';
import { TicketsModule } from './tickets/tickets.module';
import { ProductsModule } from './products/products.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { CouponsModule } from './coupons/coupons.module';
import { PartnersModule } from './partners/partners.module';
import { PaymentsModule } from './payments/payments.module';
import { RolesModule } from './roles/roles.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { UsefulLinksModule } from './useful-links/useful-links.module';
import { PreferencesModule } from './preferences/preferences.module';
import { InvoicesModule } from './invoices/invoices.module';
import { EmailTemplatesModule } from './email-templates/email-templates.module';
import { CreditsModule } from './credits/credits.module';
import { Setting } from './entities/setting.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get('DB_TYPE', 'sqlite');
        if (dbType === 'mysql') {
          return {
            type: 'mysql',
            host: config.get('DB_HOST', 'localhost'),
            port: parseInt(config.get('DB_PORT', '3306')),
            username: config.get('DB_USER', 'root'),
            password: config.getOrThrow('DB_PASSWORD'),
            database: config.get('DB_NAME', 'zyphron'),
            entities: [__dirname + '/entities/*.entity{.ts,.js}'],
            synchronize: config.get('NODE_ENV') !== 'production',
          };
        }
        return {
          type: 'better-sqlite3',
          database: 'zyphron.db',
          entities: [__dirname + '/entities/*.entity{.ts,.js}'],
          synchronize: config.get('NODE_ENV') !== 'production',
        };
      },
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    UsersModule,
    MailModule,
    PterodactylModule,
    DiscordModule,
    ServersModule,
    AfkModule,
    StoreModule,
    AdminModule,
    EconomyModule,
    AchievementsModule,
    TicketsModule,
    ProductsModule,
    VouchersModule,
    CouponsModule,
    PartnersModule,
    PaymentsModule,
    RolesModule,
    ApiKeysModule,
    ActivityLogsModule,
    UsefulLinksModule,
    PreferencesModule,
    InvoicesModule,
    EmailTemplatesModule,
    CreditsModule,
    TypeOrmModule.forFeature([Setting]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
