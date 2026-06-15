import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ServersService } from './servers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('admin/servers')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminServersController {
  constructor(private serversService: ServersService) {}

  @Get()
  async listAllServers() {
    return this.serversService.getAllServers();
  }

  @Get(':id')
  async getServer(@Param('id', ParseIntPipe) id: number) {
    return this.serversService.getServerById(id);
  }

  @Post(':id/suspend')
  async suspendServer(@Param('id', ParseIntPipe) id: number) {
    return this.serversService.suspendServer(id);
  }

  @Post(':id/unsuspend')
  async unsuspendServer(@Param('id', ParseIntPipe) id: number) {
    return this.serversService.unsuspendServer(id);
  }
}
