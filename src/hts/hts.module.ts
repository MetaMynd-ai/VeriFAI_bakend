import { Module } from '@nestjs/common';
import { HtsService } from './hts.service';
import { HtsController } from './hts.controller';
import { HttpModule } from '@nestjs/axios';
import { SmartConfigModule } from '@hsuite/smart-config';

@Module({
  imports: [HttpModule,SmartConfigModule],
  providers: [HtsService],
  controllers: [HtsController],
  exports: [HtsService]
})
export class HtsModule {}
