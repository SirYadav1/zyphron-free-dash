import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('servers')
@UseGuards(JwtAuthGuard)
export class ServersController {
  constructor(private serversService: ServersService) {}

  @Get('blueprint')
  async getBlueprint() {
    return this.serversService.getBlueprint();
  }

  @Get('plans')
  async getPlans() {
    return this.serversService.getPlans();
  }

  @Get()
  async listServers(@CurrentUser() user: any) {
    const servers = await this.serversService.getUserServers(user.id);
    return servers;
  }
  @Get('nests')
  @UseGuards(AdminGuard)
  async getNests() {
    return this.serversService.getNests();
  }

  @Get('nests/:id/eggs')
  @UseGuards(AdminGuard)
  async getEggs(@Param('id', ParseIntPipe) id: number) {
    return this.serversService.getEggsByNest(id);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return this.serversService.getUserServerStats(user.id);
  }

  @Post()
  async createServer(@Body() dto: CreateServerDto, @CurrentUser() user: any) {
    // nestId is NEVER accepted from the client (H5): the nest comes from the
    // product or blueprint. eggId is only honored when a product leaves it
    // open for user choice, and is validated against allowed_egg_ids.
    return this.serversService.createServer(user.id, dto.serverName, dto.productId, dto.eggId);
  }

  @Get(':id')
  async getServer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.serversService.getServerById(id, user.id);
  }

  @Put(':id')
  async updateServer(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { serverName?: string },
    @CurrentUser() user: any,
  ) {
    return this.serversService.updateServer(id, user.id, body);
  }

  @Delete(':id')
  async deleteServer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    await this.serversService.deleteServer(id, user.id);
    return { message: 'Server deleted successfully' };
  }
}
