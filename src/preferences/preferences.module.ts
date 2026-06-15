import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreferencesController } from './preferences.controller';
import { Setting } from '../entities/setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  controllers: [PreferencesController],
})
export class PreferencesModule {}
