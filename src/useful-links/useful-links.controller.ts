import { Controller, Get } from '@nestjs/common';
import { UsefulLinksService } from './useful-links.service';

@Controller('useful-links')
export class UsefulLinksController {
  constructor(private readonly usefulLinksService: UsefulLinksService) {}

  @Get()
  async findAll() {
    return this.usefulLinksService.findAll();
  }
}
