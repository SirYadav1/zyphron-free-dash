import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
  ) {}

  @Get('config')
  getPublicConfig() {
    return {
      siteName: 'Zyphron Cloud',
      pterodactylPanelUrl:
        process.env.PTERODACTYL_PANEL_URL || 'https://panel.zyphron.cloud/',
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
