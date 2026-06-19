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
@UseGuards(JwtAuthGuard)
export class AfkController {
  constructor(private afkService: AfkService) {}

  @Post('start')
  async startSession(@CurrentUser() user: any) {
    return this.afkService.startSession(user.id);
  }

  @Post('heartbeat')
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
  @HttpCode(200)
  async stopSession(@Body() dto: EndSessionDto, @CurrentUser() user: any) {
    await this.afkService.endSession(dto.sessionId, dto.tabId, user.id);
    return { message: 'Session ended' };
  }

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return this.afkService.getStats(user.id);
  }
}
