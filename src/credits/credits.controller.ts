import {
  Controller,
  Get,
  Post,
  UseGuards,
  BadRequestException,
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
    _dto: BuyCreditsDto,
    @CurrentUser() user: any,
  ) {
    // DISABLED (C4): this route credited coins without any real payment —
    // an unauthenticated mint. Real purchases flow through coin orders
    // (screenshot -> admin approval). Do not re-enable without a payment
    // gateway callback / admin approval gate.
    throw new BadRequestException(
      'Direct credit purchases are currently disabled. Please use the coin order flow.',
    );
  }
}
