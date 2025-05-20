import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { BalanceResponse } from './interfaces/balance-response.interface'; // Import the class
import { ApiTags, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags('balance')
@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get(':accountId')
  @ApiParam({ name: 'accountId', required: true, description: 'Hedera account ID' })
  @ApiQuery({ name: 'isHbar', required: false, type: Boolean, description: 'Convert balance to Hbar' })
  @ApiResponse({ status: 200, description: 'The account balance', type: BalanceResponse })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getBalance(
    @Param('accountId') accountId: string,
    @Query('isHbar') isHbar?: string
  ): Promise<BalanceResponse> {
    const convertToHbar = isHbar === 'true';  // Convert query parameter to boolean
    try {
      return await this.balanceService.getBalance(accountId, convertToHbar);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Account not found');
      }
      throw error;
    }
  }
}