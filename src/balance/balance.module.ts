import { Module } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { BalanceController } from './balance.controller';
import { HttpModule } from '@nestjs/axios';
import { SmartConfigModule } from '@hsuite/smart-config';

@Module({
  imports: [HttpModule,SmartConfigModule],
  providers: [BalanceService],
  controllers: [BalanceController],
  exports: [BalanceService]
})
export class BalanceModule { }
