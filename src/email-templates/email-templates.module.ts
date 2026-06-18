import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplate } from '../entities/email-template.entity';
import { User } from '../entities/user.entity';
import { Setting } from '../entities/setting.entity';
import { EmailTemplatesService } from './email-templates.service';
import { EmailTemplatesController } from './email-templates.controller';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmailTemplate, User, Setting])],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService, MailService],
  exports: [EmailTemplatesService],
})
export class EmailTemplatesModule {}
