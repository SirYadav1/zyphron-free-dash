import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { EmailTemplateHelper } from '../common/utils/email-template-helper';
import { Setting } from '../entities/setting.entity';
import { EmailTemplate } from '../entities/email-template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting, EmailTemplate])],
  providers: [MailService, EmailTemplateHelper],
  exports: [MailService, EmailTemplateHelper],
})
export class MailModule {}
