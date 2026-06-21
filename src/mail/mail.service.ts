import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Setting } from '../entities/setting.entity';
import { EmailTemplate } from '../entities/email-template.entity';
import { EncryptionUtil } from '../common/utils/encryption.util';

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
  ) {
    this.initTransporter();
  }

  private async initTransporter() {
    try {
      // Try loading from database settings first
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
      // Fallback to env vars
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
      from: settingsMap.get('smtp_from') || process.env.MAIL_FROM || 'noreply@zyphron.com',
      from_name: settingsMap.get('smtp_from_name') || process.env.MAIL_FROM_NAME || 'Zyphron',
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
   * Send a generic email with custom subject and HTML body
   */
  async sendEmail(to: string, subject: string, htmlBody: string, fromAddress?: string): Promise<boolean> {
    const settings = await this.settingRepo.find();
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));
    const from = fromAddress || settingsMap.get('smtp_from') || process.env.MAIL_FROM || 'noreply@zyphron.com';

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

  /**
   * Render a template from the database by name, replacing {{variable}} placeholders.
   * Falls back to a minimal HTML email if the template is not found.
   */
  async renderFromDb(templateName: string, vars: Record<string, string> = {}): Promise<{ subject: string; html: string }> {
    const template = await this.templateRepo.findOne({ where: { name: templateName } });
    if (!template) {
      this.logger.warn(`Template "${templateName}" not found in DB, using fallback`);
      return {
        subject: `Notification — ${templateName}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <p>${Object.entries(vars).map(([k, v]) => `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}`).join('<br>')}</p>
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
    const from = settingsMap.get('smtp_from') || process.env.MAIL_FROM || 'noreply@zyphron.com';
    const fromName = settingsMap.get('smtp_from_name') || 'ZyphronCloud';

    return this.safeSendMail({
      from: `${fromName} <${from}>`,
      to,
      subject: 'Zyphron Cloud — SMTP Test ✅',
      html: `
        <div style="margin:0;padding:0;background:#0a0f1a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;">
            <tr><td align="center" style="padding:40px 20px;">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                <tr><td style="padding:48px 40px 36px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:16px 16px 0 0;text-align:center;">
                  <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;margin:0 auto 16px;line-height:56px;font-size:28px;">☁️</div>
                  <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">SMTP Working!</h1>
                  <p style="margin:10px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Email system is configured correctly</p>
                </td></tr>
                <tr><td style="padding:36px 40px;background:#0f1729;border-left:1px solid rgba(255,255,255,0.04);border-right:1px solid rgba(255,255,255,0.04);">
                  <p style="margin:10px 0;font-size:15px;line-height:1.7;color:#94a3b8;">This is a test email from your <strong style="color:#e2e8f0;">Zyphron Cloud</strong> dashboard to verify SMTP configuration.</p>
                  <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:20px;margin:20px 0;">
                    <p style="margin:4px 0;font-size:13px;color:#94a3b8;">📧 Sent to: <strong style="color:#e2e8f0;">${escapeHtml(to)}</strong></p>
                    <p style="margin:4px 0;font-size:13px;color:#94a3b8;">🕐 Time: <strong style="color:#e2e8f0;">${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</strong></p>
                  </div>
                  <p style="margin:10px 0;font-size:13px;color:#64748b;">✅ If you received this, your SMTP settings are working. You can now send automated notifications to users.</p>
                </td></tr>
                <tr><td style="padding:24px 40px;background:#080c15;border-radius:0 0 16px 16px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
                  <p style="margin:0 0 6px;font-size:11px;color:#4b5563;letter-spacing:0.5px;text-transform:uppercase;">Zyphron Cloud</p>
                  <p style="margin:0;font-size:11px;color:#374151;">© 2026 Zyphron Cloud. All rights reserved.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </div>
      `,
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
    return this.safeSendMail({ from: process.env.MAIL_FROM || 'noreply@zyphron.com', to, subject, html });
  }

  async sendBanNotification(to: string, reason: string, firstName?: string) {
    const { subject, html } = await this.renderFromDb('Account Banned', {
      first_name: firstName || to.split('@')[0],
      reason: reason || 'Terms of service violation',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    });
    if (!html) return false;
    return this.safeSendMail({ from: process.env.MAIL_FROM || 'noreply@zyphron.com', to, subject, html });
  }

  async sendUnbanNotification(to: string, firstName?: string) {
    // No dedicated template — send a simple confirmation
    return this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: 'Account Unbanned — Zyphron Cloud',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0f1a;color:#e2e8f0;">
        <h2 style="color:#10b981;">✅ Account Unbanned</h2>
        <p>Hey ${escapeHtml(firstName || to.split('@')[0])},</p>
        <p>Your account has been unbanned. You may now log in and use our services again.</p>
        <p style="color:#6b7280;font-size:12px;margin-top:20px;">© 2026 Zyphron Cloud</p>
      </div>`,
    });
  }

  async sendServerSuspension(to: string, serverName: string, reason: string, firstName?: string) {
    const { subject, html } = await this.renderFromDb('Server Suspended', {
      first_name: firstName || to.split('@')[0],
      server_name: serverName,
      reason: reason || 'Policy violation',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      dashboard_url: process.env.FRONTEND_URL || 'https://zyphron.cloud',
    });
    if (!html) return false;
    return this.safeSendMail({ from: process.env.MAIL_FROM || 'noreply@zyphron.com', to, subject, html });
  }

  async sendServerUnsuspension(to: string, serverName: string, firstName?: string) {
    // No dedicated template — send a simple confirmation
    return this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: `Server Unsuspended — ${serverName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0f1a;color:#e2e8f0;">
        <h2 style="color:#10b981;">✅ Server Unsuspended</h2>
        <p>Hey ${escapeHtml(firstName || to.split('@')[0])},</p>
        <p>Your server <strong>${escapeHtml(serverName)}</strong> has been unsuspended and is now active.</p>
        <p style="color:#6b7280;font-size:12px;margin-top:20px;">© 2026 Zyphron Cloud</p>
      </div>`,
    });
  }

  async sendServerDeletion(to: string, serverName: string, reason: string, firstName?: string) {
    return this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: `Server Deleted — ${serverName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0f1a;color:#e2e8f0;">
        <h2 style="color:#ef4444;">🗑️ Server Deleted</h2>
        <p>Hey ${escapeHtml(firstName || to.split('@')[0])},</p>
        <p>Your server <strong>${escapeHtml(serverName)}</strong> has been deleted.</p>
        ${reason ? `<p>Reason: <strong>${escapeHtml(reason)}</strong></p>` : ''}
        <p>All data associated with this server has been permanently removed.</p>
        <p style="color:#6b7280;font-size:12px;margin-top:20px;">© 2026 Zyphron Cloud</p>
      </div>`,
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
      dashboard_url: process.env.FRONTEND_URL || 'https://zyphron.cloud',
    });
    if (!html) return false;
    return this.safeSendMail({ from: process.env.MAIL_FROM || 'noreply@zyphron.com', to, subject, html });
  }

  /**
   * Send payment declined email
   */
  async sendPaymentDeclined(to: string, username: string, orderId: number, reason?: string) {
    return this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: `Payment Declined — Order #${orderId} — Zyphron Cloud`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0f1a;color:#e2e8f0;">
        <h2 style="color:#ef4444;">Payment Declined</h2>
        <p>Hey ${escapeHtml(username)},</p>
        <p>Your payment for order <strong>#${orderId}</strong> has been declined.</p>
        ${reason ? `<p>Reason: <strong>${escapeHtml(reason)}</strong></p>` : ''}
        <p>Please try again or contact support.</p>
        <p style="color:#6b7280;font-size:12px;margin-top:20px;">© 2026 Zyphron Cloud</p>
      </div>`,
    });
  }

  /**
   * Send voucher redeemed email
   */
  async sendVoucherRedeemed(to: string, username: string, voucherCode: string, credits: number) {
    return this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: `Voucher Redeemed — +${credits} Coins — Zyphron Cloud`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0f1a;color:#e2e8f0;">
        <h2 style="color:#10b981;">🎟️ Voucher Redeemed!</h2>
        <p>Hey ${escapeHtml(username)},</p>
        <p>You redeemed <strong>${escapeHtml(voucherCode)}</strong> and received <strong>${credits} coins</strong>.</p>
        <p style="color:#6b7280;font-size:12px;margin-top:20px;">© 2026 Zyphron Cloud</p>
      </div>`,
    });
  }

  /**
   * Send partner commission email
   */
  async sendPartnerCommission(to: string, username: string, commission: number, referredUser: string) {
    return this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: `Partner Commission — +${commission} Coins — Zyphron Cloud`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0f1a;color:#e2e8f0;">
        <h2 style="color:#3b82f6;">💰 Commission Earned!</h2>
        <p>Hey ${escapeHtml(username)},</p>
        <p>You earned <strong>${commission} coins</strong> for referring <strong>${escapeHtml(referredUser)}</strong>.</p>
        <p>Keep sharing your partner link to earn more!</p>
        <p style="color:#6b7280;font-size:12px;margin-top:20px;">© 2026 Zyphron Cloud</p>
      </div>`,
    });
  }
}
