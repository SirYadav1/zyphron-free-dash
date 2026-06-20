import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Setting } from '../entities/setting.entity';

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
      const smtpPass = settingsMap.get('smtp_pass') || process.env.MAIL_PASS;
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
   * Send a test email to verify SMTP configuration
   */
  async sendTestEmail(to: string): Promise<boolean> {
    const settings = await this.settingRepo.find();
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));
    const from = settingsMap.get('smtp_from') || process.env.MAIL_FROM || 'noreply@zyphron.com';

    return this.safeSendMail({
      from,
      to,
      subject: 'Zyphron — Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #e0e0e0;">
          <div style="text-align: center; padding: 30px 0;">
            <h1 style="color: #7c3aed; margin: 0;">Zyphron</h1>
            <p style="color: #9ca3af; margin-top: 8px;">Email System Test</p>
          </div>
          <div style="background: #16213e; border-radius: 12px; padding: 30px; border: 1px solid #2d3748;">
            <h2 style="color: #22c55e; margin-top: 0;">✅ SMTP Configuration Working!</h2>
            <p>This is a test email sent from your Zyphron dashboard to verify that SMTP is configured correctly.</p>
            <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #1e293b;">
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">Sent to: <strong style="color: #e0e0e0;">${escapeHtml(to)}</strong></p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 13px;">Time: <strong style="color: #e0e0e0;">${new Date().toISOString()}</strong></p>
            </div>
            <p style="color: #6b7280; font-size: 13px;">If you received this email, your SMTP settings are working correctly. You can now send automated notifications to users.</p>
          </div>
          <div style="text-align: center; padding: 20px 0; color: #4b5563; font-size: 12px;">
            <p>This is an automated message from Zyphron Hosting Panel.</p>
          </div>
        </div>
      `,
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify?token=${token}`;

    await this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: 'Verify Your Email - Zyphron',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">Welcome to Zyphron!</h1>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #7c3aed; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-size: 16px;">
              Verify Email
            </a>
          </div>
          <p>Or copy this link into your browser:</p>
          <p style="color: #6b7280; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #6b7280; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
      `,
    });
  }

  async sendBanNotification(to: string, reason: string) {
    await this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: 'Account Banned - Zyphron',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Account Banned</h1>
          <p>Your account has been banned.</p>
          ${reason ? `<p>Reason: ${escapeHtml(reason)}</p>` : ''}
          <p>If you believe this is a mistake, please contact support.</p>
        </div>
      `,
    });
  }

  async sendUnbanNotification(to: string) {
    await this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: 'Account Unbanned - Zyphron',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Account Unbanned</h1>
          <p>Your account has been unbanned. You may now log in and use our services again.</p>
        </div>
      `,
    });
  }

  async sendServerSuspension(to: string, serverName: string, reason: string) {
    await this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: 'Server Suspended - Zyphron',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">Server Suspended</h1>
          <p>Your server <strong>${escapeHtml(serverName)}</strong> has been suspended.</p>
          <p>Reason: ${escapeHtml(reason)}</p>
          <p>Please contact support or take the necessary actions to restore it.</p>
        </div>
      `,
    });
  }

  async sendServerUnsuspension(to: string, serverName: string) {
    await this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: 'Server Unsuspended - Zyphron',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Server Unsuspended</h1>
          <p>Your server <strong>${serverName}</strong> has been unsuspended and is now active.</p>
        </div>
      `,
    });
  }

  async sendServerDeletion(to: string, serverName: string, reason: string) {
    await this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: 'Server Deleted - Zyphron',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Server Deleted</h1>
          <p>Your server <strong>${escapeHtml(serverName)}</strong> has been deleted.</p>
          <p>Reason: ${escapeHtml(reason)}</p>
          <p>All data associated with this server has been permanently removed.</p>
          <p>If you want to create a new server, please make sure you have enough credits.</p>
        </div>
      `,
    });
  }

  /**
   * Send payment approved email
   */
  async sendPaymentApproved(to: string, username: string, coins: number, orderId: number) {
    await this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: `Payment Approved — ${coins} Coins Added - Zyphron`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e;">Payment Approved! 🎉</h1>
          <p>Hi <strong>${escapeHtml(username)}</strong>,</p>
          <p>Your payment for order <strong>#${orderId}</strong> has been approved and <strong>${coins} coins</strong> have been added to your account.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #166534; font-size: 24px; font-weight: bold;">+${coins} Coins</p>
          </div>
          <p>You can now use your coins to purchase servers and other services.</p>
          <p style="color: #6b7280; font-size: 12px;">If you have any questions, please contact support.</p>
        </div>
      `,
    });
  }

  /**
   * Send payment declined email
   */
  async sendPaymentDeclined(to: string, username: string, orderId: number, reason?: string) {
    await this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: `Payment Declined — Order #${orderId} - Zyphron`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">Payment Declined</h1>
          <p>Hi <strong>${escapeHtml(username)}</strong>,</p>
          <p>Your payment for order <strong>#${orderId}</strong> has been declined.</p>
          ${reason ? `<p>Reason: <strong>${escapeHtml(reason)}</strong></p>` : ''}
          <p>Please try again or contact support for assistance.</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #991b1b; font-size: 16px; font-weight: bold;">Payment Not Processed</p>
          </div>
          <p style="color: #6b7280; font-size: 12px;">If you believe this is an error, please contact support.</p>
        </div>
      `,
    });
  }

  /**
   * Send voucher redeemed email
   */
  async sendVoucherRedeemed(to: string, username: string, voucherCode: string, credits: number) {
    await this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: `Voucher Redeemed — +${credits} Coins - Zyphron`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e;">Voucher Redeemed! 🎟️</h1>
          <p>Hi <strong>${escapeHtml(username)}</strong>,</p>
          <p>You have successfully redeemed voucher <strong>${escapeHtml(voucherCode)}</strong> and received <strong>${credits} coins</strong>.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #166534; font-size: 24px; font-weight: bold;">+${credits} Coins</p>
          </div>
          <p>You can now use your coins to purchase servers and other services.</p>
          <p style="color: #6b7280; font-size: 12px;">If you have any questions, please contact support.</p>
        </div>
      `,
    });
  }

  /**
   * Send partner commission email
   */
  async sendPartnerCommission(to: string, username: string, commission: number, referredUser: string) {
    await this.safeSendMail({
      from: process.env.MAIL_FROM || 'noreply@zyphron.com',
      to,
      subject: `Partner Commission Earned — +${commission} Coins - Zyphron`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #7c3aed;">Partner Commission Earned! 💰</h1>
          <p>Hi <strong>${escapeHtml(username)}</strong>,</p>
          <p>You have earned a partner commission of <strong>${commission} coins</strong> for referring <strong>${escapeHtml(referredUser)}</strong>.</p>
          <div style="background: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #5b21b6; font-size: 24px; font-weight: bold;">+${commission} Coins</p>
          </div>
          <p>Keep sharing your partner link to earn more commissions!</p>
          <p style="color: #6b7280; font-size: 12px;">If you have any questions, please contact support.</p>
        </div>
      `,
    });
  }
}
