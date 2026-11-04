import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString, IsInt, Min, IsIn } from 'class-validator';

class UpgradeDto {
  @IsString()
  @IsIn(['ram', 'cpu', 'disk'])
  type: 'ram' | 'cpu' | 'disk';

  // integer MB/% increments only — floats (1.5 MB) must never reach Pterodactyl
  @IsInt()
  @Min(1)
  amount: number;
}

@Controller('store')
@UseGuards(JwtAuthGuard)
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Get(':serverId')
  async getUpgradeOptions(
    @Param('serverId', ParseIntPipe) serverId: number,
    @CurrentUser() user: any,
  ) {
    return this.storeService.getUpgradeOptions(serverId, user.id);
  }

  @Post(':serverId/upgrade')
  async upgradeServer(
    @Param('serverId', ParseIntPipe) serverId: number,
    @Body() dto: UpgradeDto,
    @CurrentUser() user: any,
  ) {
    return this.storeService.upgradeServer(
      serverId,
      user.id,
      dto.type,
      dto.amount,
    );
  }

  @Post(':serverId/renew')
  async renewServer(
    @Param('serverId', ParseIntPipe) serverId: number,
    @CurrentUser() user: any,
  ) {
    return this.storeService.renewServer(serverId, user.id);
  }
}
