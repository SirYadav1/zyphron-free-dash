import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { AppService } from './app.service';
import { BrandService } from './common/brand/brand.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly brandService: BrandService,
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
  ) {}

  @Get('config')
  async getPublicConfig() {
    return {
      // white-label: brand name flows from admin setting / env, never hardcoded
      siteName: await this.brandService.getBrandName(),
      pterodactylPanelUrl:
        process.env.PTERODACTYL_PANEL_URL || 'https://your-panel.com/',
    };
  }

  @Get('branding')
  async getBranding() {
    const keys = ['brand_name', 'login_image_url', 'favicon_url'];
    const settings = await this.settingRepo.find({ where: { key: In(keys) } });
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return {
      name: await this.brandService.getBrandName(),
      login_image_url: map['login_image_url'] || '',
      favicon_url: map['favicon_url'] || '',
    };
  }

  @Get('public-settings')
  async getPublicSettings() {
    const keys = ['login_image_url', 'favicon_url'];
    const settings = await this.settingRepo.find({ where: { key: In(keys) } });
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return {
      login_image_url: map['login_image_url'] || '',
      favicon_url: map['favicon_url'] || '',
    };
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'zyphron-client-area' };
  }
}
