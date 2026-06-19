import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ServiceCategoriesService } from './service-categories.service';

@Controller('categories')
export class UserCategoriesController {
  constructor(
    private readonly categoriesService: ServiceCategoriesService,
  ) {}

  @Get()
  async findActive() {
    return this.categoriesService.findActive();
  }

  @Get(':id/products')
  async findCategoryProducts(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findCategoryProducts(id);
  }
}
