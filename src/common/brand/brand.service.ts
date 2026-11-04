import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../../entities/setting.entity';

const CACHE_MS = 60_000; // 1 minute

/**
 * White-label branding (single source of truth).
 *
 * Priority: DB setting `brand_name` (admin panel → Branding) →
 * env `BRAND_NAME` → default 'Zyphron Cloud'.
 *
 * Nothing anywhere else should hardcode the brand name — inject this and
 * call getBrandName(). Short TTL cache keeps it cheap on hot paths (emails,
 * 2FA issuer, public config).
 */
@Injectable()
export class BrandService {
  private cache: { name: string; at: number } | null = null;

  constructor(
    @InjectRepository(Setting) private readonly settingRepo: Repository<Setting>,
  ) {}

  async getBrandName(): Promise<string> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) {
      return this.cache.name;
    }

    let name = '';
    try {
      const setting = await this.settingRepo.findOne({
        where: { key: 'brand_name' },
      });
      if (setting?.value) name = setting.value.trim();
    } catch {
      // DB unavailable — fall through to env/default
    }
    if (!name) name = (process.env.BRAND_NAME || '').trim();
    if (!name) name = 'Zyphron Cloud';

    this.cache = { name, at: Date.now() };
    return name;
  }
}
