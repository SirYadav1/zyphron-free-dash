import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../../entities/setting.entity';

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
export class EmailTemplateHelper {
  private readonly logger = new Logger(EmailTemplateHelper.name);

  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  /**
   * Get the logo URL from settings
   */
  async getLogoUrl(): Promise<string> {
    const setting = await this.settingRepo.findOne({ where: { key: 'email_logo_url' } });
    return setting?.value || 'https://litter.catbox.moe/95lej9.png';
  }

  /**
   * Get the brand name from settings (env fallback, never hardcode)
   */
  async getBrandName(): Promise<string> {
    const setting = await this.settingRepo.findOne({ where: { key: 'brand_name' } });
    return setting?.value?.trim() || (process.env.BRAND_NAME || '').trim() || 'Zyphron Cloud';
  }

  /**
   * Generate the email header with logo
   */
  async getHeader(gradient: string = 'linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)'): Promise<string> {
    const logo = await this.getLogoUrl();
    const brandName = await this.getBrandName();
    
    return `
      <tr><td style="padding:48px 40px 36px;background:${gradient};border-radius:16px 16px 0 0;text-align:center;">
        <img src="${escapeHtml(logo)}" alt="${escapeHtml(brandName)}" style="width:80px;height:80px;border-radius:16px;margin:0 auto 16px;display:block;" />
        <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">${escapeHtml(brandName)}</h1>
      </td></tr>
    `;
  }

  /**
   * Generate the email footer
   */
  async getFooter(): Promise<string> {
    const brandName = await this.getBrandName();
    const year = new Date().getFullYear();
    
    return `
      <tr><td style="padding:24px 40px;background:#080c15;border-radius:0 0 16px 16px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;color:#4b5563;letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(brandName)}</p>
        <p style="margin:0;font-size:11px;color:#374151;">© ${year} ${escapeHtml(brandName)}. All rights reserved.</p>
      </td></tr>
    `;
  }

  /**
   * Wrap content in the full email template
   */
  async wrap(content: string, gradient?: string): Promise<string> {
    const header = await this.getHeader(gradient);
    const footer = await this.getFooter();
    
    return `
      <div style="margin:0;padding:0;background:#0a0f1a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;">
          <tr><td align="center" style="padding:40px 20px;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
              ${header}
              <tr><td style="padding:36px 40px;background:#0f1729;border-left:1px solid rgba(255,255,255,0.04);border-right:1px solid rgba(255,255,255,0.04);">
                ${content}
              </td></tr>
              ${footer}
            </table>
          </td></tr>
        </table>
      </div>
    `;
  }

  /**
   * Generate a simple text paragraph
   */
  p(text: string, options: { color?: string; size?: string; margin?: string } = {}): string {
    const { color = '#94a3b8', size = '15px', margin = '10px 0' } = options;
    return `<p style="margin:${margin};font-size:${size};line-height:1.7;color:${color};">${text}</p>`;
  }

  /**
   * Generate a highlighted box
   */
  box(content: string, color: string = 'blue'): string {
    const colors: Record<string, { bg: string; border: string }> = {
      blue: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)' },
      green: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)' },
      red: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)' },
      yellow: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)' },
      purple: { bg: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.2)' },
    };
    
    const c = colors[color] || colors.blue;
    return `<div style="background:${c.bg};border:1px solid ${c.border};border-radius:12px;padding:20px;margin:20px 0;">${content}</div>`;
  }

  /**
   * Generate a button
   */
  button(text: string, url: string, color: string = '#3b82f6'): string {
    return `
      <div style="text-align:center;margin:24px 0;">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 32px;background:${color};color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">${escapeHtml(text)}</a>
      </div>
    `;
  }

  /**
   * Generate info row (label: value)
   */
  infoRow(label: string, value: string): string {
    return `<p style="margin:4px 0;font-size:13px;color:#94a3b8;">${escapeHtml(label)}: <strong style="color:#e2e8f0;">${escapeHtml(value)}</strong></p>`;
  }
}
