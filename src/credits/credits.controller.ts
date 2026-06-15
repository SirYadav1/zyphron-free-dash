import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { IsNumber } from 'class-validator';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class BuyCreditsDto {
  @IsNumber()
  packageId: number;
}

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('packages')
  async getCreditPackages() {
    return this.creditsService.getCreditPackages();
  }

  @Post('buy')
  @UseGuards(JwtAuthGuard)
  async buyCredits(
    @Body() dto: BuyCreditsDto,
    @CurrentUser() user: any,
  ) {
    return this.creditsService.buyCredits(user.id, dto.packageId);
  }
}
