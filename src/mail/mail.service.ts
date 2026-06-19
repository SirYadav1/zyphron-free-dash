import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

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
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private configured = false;

  constructor() {
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

  private async safeSendMail(options: any): Promise<boolean> {
    if (!this.configured) {
      this.logger.warn(`Email skipped (not configured): ${options.subject}`);
      return false;
    }
    try {
      await this.transporter.sendMail(options);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
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
}
