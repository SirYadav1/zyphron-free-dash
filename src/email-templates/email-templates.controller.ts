import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { IsString, IsBoolean, IsOptional, IsEmail } from 'class-validator';
import { EmailTemplatesService } from './email-templates.service';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

class CreateEmailTemplateDto {
  @IsString()
  name: string;

  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

class UpdateEmailTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

class TestEmailDto {
  @IsEmail()
  email: string;
}

@Controller('admin/email-templates')
@UseGuards(JwtAuthGuard, AdminGuard)
export class EmailTemplatesController {
  constructor(
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  async findAll() {
    return this.emailTemplatesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.emailTemplatesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateEmailTemplateDto) {
    return this.emailTemplatesService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmailTemplateDto,
  ) {
    return this.emailTemplatesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.emailTemplatesService.remove(id);
    return { message: 'Template deleted successfully' };
  }

  @Post(':id/test')
  async testTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TestEmailDto,
  ) {
    const template = await this.emailTemplatesService.findOne(id);

    // sample vars, must match every placeholder in the template
    const sampleVars = {
      first_name: 'TestUser',
      username: 'TestUser',
      email: dto.email,
      company_name: 'Zyphron Cloud',
      server_name: 'Test Server',
      ram: '2 GB',
      cpu: '100%',
      disk: '10 GB',
      reason: 'This is a test email',
      coins: '100',
      amount: '10',
      order_id: '1',
      ticket_id: '1001',
      subject: 'Test Support Request',
      priority: 'Medium',
      renewal_price: '5',
      voucher_code: 'TEST-CODE',
      commission: '50',
      referred_user: 'TestReferred',
      token: 'test-token-123',
      verification_url: 'https://your-domain.com/verify?token=test',
      reset_url: 'https://your-domain.com/reset?token=test',
      dashboard_url: 'https://your-domain.com/dashboard',
      panel_url: 'https://your-panel.com',
      renew_url: 'https://your-domain.com/renew',
      expires_at: '2026-07-15',
      expiry_hours: '24',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };

    const { subject, body } = await this.emailTemplatesService.render(template.name, sampleVars);
    const sent = await this.mailService.sendEmail(dto.email, subject, body);

    if (sent) {
      return { message: `Test email sent to ${dto.email}`, template: template.name };
    } else {
      return { message: 'Failed to send test email. Check SMTP configuration.', error: true };
    }
  }
}
