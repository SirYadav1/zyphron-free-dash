import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UniversalApiController } from './universal-api.controller';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ApplicationApi } from '../entities/application-api.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationApi])],
  controllers: [UniversalApiController],
  providers: [ApiKeyGuard],
  exports: [ApiKeyGuard],
})
export class UniversalApiModule {}
