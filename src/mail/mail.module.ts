import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { Setting } from '../entities/setting.entity';
import { EmailTemplate } from '../entities/email-template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting, EmailTemplate])],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
