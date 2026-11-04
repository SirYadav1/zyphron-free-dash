import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Setting } from '../entities/setting.entity';
import { EmailTemplate } from '../entities/email-template.entity';
import { EncryptionUtil } from '../common/utils/encryption.util';
import { EmailTemplateHelper } from '../common/utils/email-template-helper';

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);
  private configured = false;

  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
    @InjectRepository(EmailTemplate)
    private readonly templateRepo: Repository<EmailTemplate>,
    private readonly templateHelper: EmailTemplateHelper,
  ) {
    this.initTransporter();
  }

  private async initTransporter() {
    try {
      // try loading from database settings first
      const settings = await this.settingRepo.find();
      const settingsMap = new Map(settings.map(s => [s.key, s.value]));

      const smtpHost = settingsMap.get('smtp_host') || process.env.MAIL_HOST || 'smtp.gmail.com';
      const smtpPort = settingsMap.get('smtp_port') || process.env.MAIL_PORT || '587';
      const smtpUser = settingsMap.get('smtp_user') || process.env.MAIL_USER;
      const smtpPass = EncryptionUtil.decrypt(settingsMap.get('smtp_pass') || process.env.MAIL_PASS || '');
      const smtpEncryption = settingsMap.get('smtp_encryption') || process.env.MAIL_ENCRYPTION || 'tls';

      if (smtpUser && smtpPass) {
        const port = parseInt(String(smtpPort));
        const secure = smtpEncryption === 'ssl' || port === 465;
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port,
          secure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        this.configured = true;
      } else {
        this.logger.warn('Mail service not configured (SMTP credentials missing). Emails will be skipped.');
      }
    } catch (error) {
      this.logger.warn('Failed to initialize mail service from DB, falling back to env:', error.message);
      // fallback to env vars
      const mailUser = process.env.MAIL_USER;
      const mailPass = process.env.MAIL_PASS;

      if (mailUser && mailPass) {
        this.transporter = nodemailer.createTransport({
          host: process.env.MAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.MAIL_PORT || '587'),
          secure: false,
          auth: {
            user: mailUser,
            pass: mailPass,
          },
        });
        this.configured = true;
      } else {
        this.logger.warn('Mail service not configured (MAIL_USER/MAIL_PASS missing). Emails will be skipped.');
      }
    }
  }

  /**
   * Re-initialize the transporter with new SMTP settings (called after settings update)
   */
  async reinitialize() {
    this.configured = false;
    this.transporter = null;
    await this.initTransporter();
    return this.configured;
  }

  /**
   * Get current SMTP configuration status (masked password)
   */
  async getSmtpConfig(): Promise<{ configured: boolean; host: string; port: number; user: string; from: string; from_name: string; encryption: string }> {
    const settings = await this.settingRepo.find();
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));

    return {
      configured: this.configured,
      host: settingsMap.get('smtp_host') || process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(settingsMap.get('smtp_port') || process.env.MAIL_PORT || '587'),
      user: settingsMap.get('smtp_user') || process.env.MAIL_USER || '',
      from: settingsMap.get('smtp_from') || process.env.MAIL_FROM || 'noreply@your-domain.com',
      from_name: settingsMap.get('smtp_from_name') || process.env.MAIL_FROM_NAME || (await this.getBrandName()),
      encryption: settingsMap.get('smtp_encryption') || process.env.MAIL_ENCRYPTION || 'tls',
    };
  }

  private async safeSendMail(options: any): Promise<boolean> {
    if (!this.configured || !this.transporter) {
      this.logger.warn(`Email skipped (not configured): ${options.subject}`);
      return false;
    }
    try {
      await this.transporter.sendMail(options);
      this.logger.log(`Email sent successfully: ${options.subject} → ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
  }

  /**
   * Get the configured sender email from database settings
   */
  private async getFromAddress(): Promise<string> {
    const settings = await this.settingRepo.find();
    const sm = new Map(settings.map(s => [s.key, s.value]));
    return sm.get('smtp_from') || process.env.MAIL_FROM || 'noreply@your-domain.com';
  }

  /**
   * White-label brand name — admin setting -> env -> default.
   * Other services (server emails, lifecycle) call this for subjects/footers.
   */
  async getBrandName(): Promise<string> {
    const settings = await this.settingRepo.find();
    const sm = new Map(settings.map(s => [s.key, s.value]));
    return sm.get('brand_name')?.trim() || (process.env.BRAND_NAME || '').trim() || 'Zyphron Cloud';
  }

  /**
   * Get the configured sender name from database settings
   */
  private async getFromName(): Promise<string> {
    const settings = await this.settingRepo.find();
    const sm = new Map(settings.map(s => [s.key, s.value]));
    return sm.get('smtp_from_name') || process.env.MAIL_FROM_NAME || (await this.getBrandName());
  }

  /**
   * Send a generic email with custom subject and HTML body
   */
  async sendEmail(to: string, subject: string, htmlBody: string, fromAddress?: string): Promise<boolean> {
    const settings = await this.settingRepo.find();
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));
    const from = fromAddress || settingsMap.get('smtp_from') || process.env.MAIL_FROM || 'noreply@your-domain.com';

    return this.safeSendMail({
      from,
      to,
      subject,
      html: htmlBody,
    });
  }

  /**
   * Render an HTML template by replacing {{variable}} placeholders
   */
  renderTemplate(template: string, vars: Record<string, string> = {}): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      const placeholder = `{{${key}}}`;
      const escapedValue = escapeHtml(value || '');
      result = result.split(placeholder).join(escapedValue);
    }
    return result;
  }

  // db template by name, falls back to a bare html mail
  async renderFromDb(templateName: string, vars: Record<string, string> = {}): Promise<{ subject: string; html: string }> {
    const template = await this.templateRepo.findOne({ where: { name: templateName } });
    if (!template) {
      this.logger.warn(`Template "${templateName}" not found in DB, using fallback`);
      const rows = Object.entries(vars)
        .map(([k, v]) => `<p style="margin:6px 0;font-size:13px;color:#334155;"><span style="color:#64748b;">${escapeHtml(k)}:</span> <strong style="color:#0f172a;">${escapeHtml(v)}</strong></p>`)
        .join('');
      return {
        subject: `Notification — ${templateName}`,
        html: `<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;padding:24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;border-collapse:separate;border-spacing:0;">
            <tr><td style="background:#2563eb;padding:26px 32px;border-radius:12px 12px 0 0;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">{{company_name}}</p>
              <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.78);">Notification</p>
            </td></tr>
            <tr><td style="background:#ffffff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
              <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;">Hi {{user_name}},</p>
              ${rows}
            </td></tr>
            <tr><td style="padding:20px 8px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">&copy; {{company_name}} &middot; This is an automated message.</p>
            </td></tr>
          </table>
        </div>`,
      };
    }
    if (!template.is_active) {
      this.logger.warn(`Template "${templateName}" is inactive, skipping`);
      return { subject: '', html: '' };
    }
    return {
      subject: this.renderTemplate(template.subject, vars),
      html: this.renderTemplate(template.body, vars),
    };
  }

  /**
   * Send a test email to verify SMTP configuration
   */
  async sendTestEmail(to: string): Promise<boolean> {
    const settings = await this.settingRepo.find();
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));
    const from = settingsMap.get('smtp_from') || process.env.MAIL_FROM || 'noreply@your-domain.com';
    const fromName = settingsMap.get('smtp_from_name') || 'ZyphronCloud';

    const content = `
      <h2 style="margin:0 0 20px;color:#10b981;font-size:22px;">SMTP Working!</h2>
      ${this.templateHelper.p('This is a test email from your <strong style="color:#e2e8f0;">Zyphron Cloud</strong> dashboard to verify SMTP configuration.')}
      ${this.templateHelper.box(`
        ${this.templateHelper.infoRow('📧 Sent to', to)}
        ${this.templateHelper.infoRow('🕐 Time', new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }))}
      `, 'green')}
      ${this.templateHelper.p('✅ If you received this, your SMTP settings are working. You can now send automated notifications to users.', { color: '#64748b', size: '13px' })}
    `;

    return this.safeSendMail({
      from: `${fromName} <${from}>`,
      to,
      subject: 'Zyphron Cloud — SMTP Test ✅',
      html: await this.templateHelper.wrap(content, 'linear-gradient(135deg,#10b981 0%,#059669 100%)'),
    });
  }

  async sendVerificationEmail(to: string, token: string, firstName?: string) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify?token=${token}`;
    const { subject, html } = await this.renderFromDb('email_verification', {
      first_name: firstName || to.split('@')[0],
      verification_url: verificationUrl,
      expiry_hours: '24',
    });
    if (!html) return false;
    return this.safeSendMail({ from: await this.getFromAddress(), to, subject, html });
  }

  async sendBanNotification(to: string, reason: string, firstName?: string) {
    const { subject, html } = await this.renderFromDb('Account Banned', {
      first_name: firstName || to.split('@')[0],
      reason: reason || 'Terms of service violation',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    });
    if (!html) return false;
    return this.safeSendMail({ from: await this.getFromAddress(), to, subject, html });
  }

  async sendUnbanNotification(to: string, firstName?: string) {
    const content = `
      <h2 style="margin:0 0 20px;color:#10b981;font-size:22px;">✅ Account Unbanned</h2>
      ${this.templateHelper.p(`Hey <strong style="color:#e2e8f0;">${escapeHtml(firstName || to.split('@')[0])}</strong>,`)}
      ${this.templateHelper.p('Your account has been unbanned. You may now log in and use our services again.')}
      ${this.templateHelper.button('Login Now', process.env.FRONTEND_URL || 'https://your-domain.com', '#10b981')}
    `;
    return this.safeSendMail({
      from: await this.getFromAddress(),
      to,
      subject: 'Account Unbanned — Zyphron Cloud',
      html: await this.templateHelper.wrap(content, 'linear-gradient(135deg,#10b981 0%,#059669 100%)'),
    });
  }

  async sendServerSuspension(to: string, serverName: string, reason: string, firstName?: string) {
    const { subject, html } = await this.renderFromDb('Server Suspended', {
      first_name: firstName || to.split('@')[0],
      server_name: serverName,
      reason: reason || 'Policy violation',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      dashboard_url: process.env.FRONTEND_URL || 'https://your-domain.com',
    });
    if (!html) return false;
    return this.safeSendMail({ from: await this.getFromAddress(), to, subject, html });
  }

  async sendServerUnsuspension(to: string, serverName: string, firstName?: string) {
    const content = `
      <h2 style="margin:0 0 20px;color:#10b981;font-size:22px;">✅ Server Unsuspended</h2>
      ${this.templateHelper.p(`Hey <strong style="color:#e2e8f0;">${escapeHtml(firstName || to.split('@')[0])}</strong>,`)}
      ${this.templateHelper.p(`Your server <strong style="color:#e2e8f0;">${escapeHtml(serverName)}</strong> has been unsuspended and is now active.`)}
      ${this.templateHelper.button('Go to Dashboard', process.env.FRONTEND_URL || 'https://your-domain.com', '#10b981')}
    `;
    return this.safeSendMail({
      from: await this.getFromAddress(),
      to,
      subject: `Server Unsuspended — ${serverName}`,
      html: await this.templateHelper.wrap(content, 'linear-gradient(135deg,#10b981 0%,#059669 100%)'),
    });
  }

  async sendServerDeletion(to: string, serverName: string, reason: string, firstName?: string) {
    const content = `
      <h2 style="margin:0 0 20px;color:#ef4444;font-size:22px;">🗑️ Server Deleted</h2>
      ${this.templateHelper.p(`Hey <strong style="color:#e2e8f0;">${escapeHtml(firstName || to.split('@')[0])}</strong>,`)}
      ${this.templateHelper.p(`Your server <strong style="color:#e2e8f0;">${escapeHtml(serverName)}</strong> has been deleted.`)}
      ${reason ? this.templateHelper.box(`<p style="margin:0;font-size:13px;color:#94a3b8;">Reason: <strong style="color:#e2e8f0;">${escapeHtml(reason)}</strong></p>`, 'red') : ''}
      ${this.templateHelper.p('All data associated with this server has been permanently removed.', { color: '#64748b', size: '13px' })}
    `;
    return this.safeSendMail({
      from: await this.getFromAddress(),
      to,
      subject: `Server Deleted — ${serverName}`,
      html: await this.templateHelper.wrap(content, 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)'),
    });
  }

  /**
   * Send payment approved email
   */
  async sendPaymentApproved(to: string, username: string, coins: number, orderId: number, firstName?: string) {
    const { subject, html } = await this.renderFromDb('Payment Received', {
      first_name: firstName || username,
      username,
      amount: String(coins),
      order_id: String(orderId),
      dashboard_url: process.env.FRONTEND_URL || 'https://your-domain.com',
    });
    if (!html) return false;
    return this.safeSendMail({ from: await this.getFromAddress(), to, subject, html });
  }

  async sendPaymentDeclined(to: string, username: string, orderId: number, reason?: string) {
    const content = `
      <h2 style="margin:0 0 20px;color:#ef4444;font-size:22px;">Payment Declined</h2>
      ${this.templateHelper.p(`Hey <strong style="color:#e2e8f0;">${escapeHtml(username)}</strong>,`)}
      ${this.templateHelper.p(`Your payment for order <strong style="color:#e2e8f0;">#${orderId}</strong> has been declined.`)}
      ${reason ? this.templateHelper.box(`<p style="margin:0;font-size:13px;color:#94a3b8;">Reason: <strong style="color:#e2e8f0;">${escapeHtml(reason)}</strong></p>`, 'red') : ''}
      ${this.templateHelper.p('Please try again or contact support.')}
    `;
    return this.safeSendMail({
      from: await this.getFromAddress(),
      to,
      subject: `Payment Declined — Order #${orderId} — Zyphron Cloud`,
      html: await this.templateHelper.wrap(content, 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)'),
    });
  }

  async sendVoucherRedeemed(to: string, username: string, voucherCode: string, credits: number) {
    const content = `
      <h2 style="margin:0 0 20px;color:#10b981;font-size:22px;">🎟️ Voucher Redeemed!</h2>
      ${this.templateHelper.p(`Hey <strong style="color:#e2e8f0;">${escapeHtml(username)}</strong>,`)}
      ${this.templateHelper.p(`You redeemed <strong style="color:#e2e8f0;">${escapeHtml(voucherCode)}</strong> and received <strong style="color:#10b981;">${credits} coins</strong>.`)}
      ${this.templateHelper.button('Go to Dashboard', process.env.FRONTEND_URL || 'https://your-domain.com', '#10b981')}
    `;
    return this.safeSendMail({
      from: await this.getFromAddress(),
      to,
      subject: `Voucher Redeemed — +${credits} Coins — Zyphron Cloud`,
      html: await this.templateHelper.wrap(content, 'linear-gradient(135deg,#10b981 0%,#059669 100%)'),
    });
  }

  async sendPartnerCommission(to: string, username: string, commission: number, referredUser: string) {
    const content = `
      <h2 style="margin:0 0 20px;color:#3b82f6;font-size:22px;">💰 Commission Earned!</h2>
      ${this.templateHelper.p(`Hey <strong style="color:#e2e8f0;">${escapeHtml(username)}</strong>,`)}
      ${this.templateHelper.p(`You earned <strong style="color:#3b82f6;">${commission} coins</strong> for referring <strong style="color:#e2e8f0;">${escapeHtml(referredUser)}</strong>.`)}
      ${this.templateHelper.p('Keep sharing your partner link to earn more!')}
      ${this.templateHelper.button('Go to Dashboard', process.env.FRONTEND_URL || 'https://your-domain.com', '#3b82f6')}
    `;
    return this.safeSendMail({
      from: await this.getFromAddress(),
      to,
      subject: `Partner Commission — +${commission} Coins — Zyphron Cloud`,
      html: await this.templateHelper.wrap(content, 'linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)'),
    });
  }
}
