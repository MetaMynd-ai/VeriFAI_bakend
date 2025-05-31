import { Module } from '@nestjs/common';
import { HcsController } from './hcs.controller';
import { HcsService } from './hcs.service';
import { HttpModule } from '@nestjs/axios';
import { SmartConfigModule } from '@hsuite/smart-config';

@Module({
  imports: [HttpModule,SmartConfigModule],
  controllers: [HcsController],
  providers: [HcsService],
  exports: [HcsService],
})
export class HcsModule {}
