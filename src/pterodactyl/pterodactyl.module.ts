import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from '../entities/setting.entity';
import { PanelConfig } from '../entities/panel-config.entity';
import { PterodactylService } from './pterodactyl.service';

@Module({
  imports: [TypeOrmModule.forFeature([Setting, PanelConfig])],
  providers: [PterodactylService],
  exports: [PterodactylService],
})
export class PterodactylModule {}
