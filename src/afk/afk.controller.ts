import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AfkService } from './afk.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsNumber, IsString, IsBoolean, Min } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

class HeartbeatDto {
  @IsNumber()
  @Min(1)
  sessionId: number;

  @IsString()
  tabId: string;

  @IsBoolean()
  visible: boolean;
}

class EndSessionDto {
  @IsNumber()
  @Min(1)
  sessionId: number;

  @IsString()
  tabId: string;
}

@Controller('afk')
export class AfkController {
  constructor(
    private afkService: AfkService,
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
  ) {}

  @Get('status')
  async getStatus() {
    const setting = await this.settingRepo.findOne({ where: { key: 'afk_enabled' } });
    return { enabled: setting?.value !== 'false' };
  }

  @Post('start')
  @UseGuards(JwtAuthGuard)
  async startSession(@CurrentUser() user: any) {
    return this.afkService.startSession(user.id);
  }

  @Post('heartbeat')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async heartbeat(@Body() dto: HeartbeatDto, @CurrentUser() user: any) {
    return this.afkService.heartbeat(
      dto.sessionId,
      dto.tabId,
      dto.visible,
      user.id,
    );
  }

  @Post('stop')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async stopSession(@Body() dto: EndSessionDto, @CurrentUser() user: any) {
    await this.afkService.endSession(dto.sessionId, dto.tabId, user.id);
    return { message: 'Session ended' };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@CurrentUser() user: any) {
    return this.afkService.getStats(user.id);
  }
}
