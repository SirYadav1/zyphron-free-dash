import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from '../../entities/setting.entity';
import { BrandService } from './brand.service';

/**
 * Global branding provider — every module can inject BrandService without
 * importing anything.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  providers: [BrandService],
  exports: [BrandService],
})
export class BrandModule {}
