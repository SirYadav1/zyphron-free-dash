import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(private achievementsService: AchievementsService) {}

  @Get()
  async getUserAchievements(@CurrentUser() user: any) {
    return this.achievementsService.getUserAchievements(user.id);
  }

  @Get('available')
  async getAvailableAchievements() {
    return this.achievementsService.getAvailableAchievements();
  }

  @Get('progress')
  async getAchievementProgress(@CurrentUser() user: any) {
    return this.achievementsService.getAchievementProgress(user.id);
  }

  @Post('check')
  async checkAchievements(@CurrentUser() user: any) {
    return this.achievementsService.checkAndAwardAchievements(user.id);
  }
}
