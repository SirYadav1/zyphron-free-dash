import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  @Get()
  async getPreferences(@CurrentUser() user: any) {
    const locale = await this.settingRepo.findOne({
      where: { key: `pref_locale_${user.id}` },
    });
    const theme = await this.settingRepo.findOne({
      where: { key: `pref_theme_${user.id}` },
    });
    return {
      locale: locale?.value || 'en-US',
      theme: theme?.value || 'dark',
    };
  }

  @Put()
  async updatePreferences(
    @CurrentUser() user: any,
    @Body() body: { locale?: string; theme?: string },
  ) {
    if (body.locale) {
      await this.upsertSetting(`pref_locale_${user.id}`, body.locale);
    }
    if (body.theme) {
      await this.upsertSetting(`pref_theme_${user.id}`, body.theme);
    }
    return { message: 'Preferences updated' };
  }

  private async upsertSetting(key: string, value: string) {
    const existing = await this.settingRepo.findOne({ where: { key } });
    if (existing) {
      await this.settingRepo.update(existing.id, { value });
    } else {
      await this.settingRepo.save(this.settingRepo.create({ key, value }));
    }
  }
}
