import { Controller, Post, Query, Body, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { HtsService } from './hts.service';
import { UnfreezeAccountsDto } from './dto/unfreeze-accounts.dto';
import { WipeNftDto } from './dto/wipe-nft.dto'; // Import the WipeNftDto
import { ApiTags, ApiQuery, ApiBody, ApiResponse, ApiOperation } from '@nestjs/swagger';

@ApiTags('HTS') // Swagger tag for grouping
@Controller('hts')
export class HtsController {
  constructor(private readonly htsService: HtsService) {}

  @Post('unfreeze')
  @ApiBody({
    description: 'List of account IDs to unfreeze',
    type: UnfreezeAccountsDto,
  })
  @ApiResponse({ status: 200, description: 'Successfully unfroze the accounts.' })
  @ApiResponse({ status: 400, description: 'Invalid input data or request.' })
  async unfreezeAccounts(
    @Body() body: UnfreezeAccountsDto,
  ): Promise<{ success: boolean; message: object }> {
    if (!body || !body.accountIds || !Array.isArray(body.accountIds)) {
      throw new BadRequestException('Account IDs must be provided as an array in the request body');
    }

    try {
      const result = await this.htsService.unfreezeAccounts(body.accountIds);
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('wipe')
  @ApiOperation({ summary: 'Wipe an NFT from an account' })
  @ApiQuery({
    name: 'accountId',
    description: 'Account ID of the NFT holder',
    example: '0.0.12345',
    required: true,
  })
  @ApiQuery({
    name: 'serial_number',
    description: 'Serial number of the NFT to be wiped',
    example: '1',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'NFT successfully wiped',
    schema: {
      example: {
        accountId: '0.0.12345',
        serial_number: '1',
        status: 'success',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or request.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async wipeNft(
    @Query('accountId') accountId: string,
    @Query('serial_number') serialNumber: string,
  ): Promise<{ accountId: string; serial_number: string; status: 'success' | 'failed'; error?: string }> {
    if (!accountId || !serialNumber) {
      throw new BadRequestException('accountId and serial_number are required');
    }

    try {
      const result = await this.htsService.wipeNft(accountId, serialNumber);
      return {
        accountId,
        serial_number: serialNumber,
        status: result.status,
      };
    } catch (error) {
      throw new HttpException(
        {
          accountId,
          serial_number: serialNumber,
          status: 'failed',
          message: error.message || 'An error occurred while wiping the NFT',
        },
        error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
