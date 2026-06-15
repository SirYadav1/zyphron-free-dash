import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { Setting } from '../entities/setting.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsUserController } from './products-user.controller';
import { PterodactylModule } from '../pterodactyl/pterodactyl.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, User, Setting]), PterodactylModule],
  controllers: [ProductsController, ProductsUserController],
  providers: [ProductsService],
})
export class ProductsModule {}
