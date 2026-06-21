import { Global, Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

@Global()
@Module({
  providers: [AdminGuard],
  exports: [AdminGuard],
})
export class GuardsModule {}
