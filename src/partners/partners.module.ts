import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnerDiscount } from '../entities/partner-discount.entity';
import { User } from '../entities/user.entity';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PartnerDiscount, User])],
  controllers: [PartnersController],
  providers: [PartnersService],
})
export class PartnersModule {}
