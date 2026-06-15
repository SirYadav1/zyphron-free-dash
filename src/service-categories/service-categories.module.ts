import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCategory } from '../entities/service-category.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { ServiceCategoriesService } from './service-categories.service';
import { AdminCategoriesController } from './admin-categories.controller';
import { UserCategoriesController } from './user-categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCategory, Product, User])],
  controllers: [AdminCategoriesController, UserCategoriesController],
  providers: [ServiceCategoriesService],
  exports: [ServiceCategoriesService],
})
export class ServiceCategoriesModule {}
