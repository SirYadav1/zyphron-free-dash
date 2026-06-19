import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ServerRenewalService } from './server-renewal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('servers')
@UseGuards(JwtAuthGuard)
export class ServerRenewalController {
  constructor(private serverRenewalService: ServerRenewalService) {}

  @Get(':id/renewal-info')
  async getRenewalInfo(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.serverRenewalService.getServerRenewalInfo(id, user.id);
  }

  @Post(':id/renew')
  async renewServer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.serverRenewalService.renewServer(id, user.id);
  }

  @Get('expiring')
  async getExpiringServers(@CurrentUser() user: any) {
    // This endpoint is for future use - lists servers about to expire for the current user
    // The checkExpiringServers cron job already identifies these
    return { message: 'Use the server list to see expiry dates' };
  }

  @Post(':id/auto-renew-toggle')
  async toggleAutoRenew(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.serverRenewalService.toggleAutoRenew(id, user.id);
  }
}
