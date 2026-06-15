import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsefulLink } from '../entities/useful-link.entity';
import { User } from '../entities/user.entity';
import { UsefulLinksService } from './useful-links.service';
import { UsefulLinksController } from './useful-links.controller';
import { AdminUsefulLinksController } from './admin-useful-links.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UsefulLink, User])],
  controllers: [UsefulLinksController, AdminUsefulLinksController],
  providers: [UsefulLinksService],
})
export class UsefulLinksModule {}
