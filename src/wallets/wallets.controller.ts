import { 
  Controller, 
  Req, 
  Get, 
  BadRequestException, 
  Post, 
  Body,
  Param,
  Delete,
  Query
} from '@nestjs/common'
import { WalletsService } from './wallets.service'
import { 
  ApiBadRequestResponse, 
  ApiBody, 
  ApiNotFoundResponse, 
  ApiOkResponse, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiResponse, 
  ApiTags 
} from '@nestjs/swagger'
import { IVC, I_IVC } from './interfaces/ivc.namespace'
import { ISmartNode, SmartNode } from '@hsuite/types'
import { AccountId } from '@hashgraph/sdk'
import { Wallet } from './entities/wallet.entity'

@Controller('wallets')
@ApiTags('wallets')
export class WalletsController {
  constructor(
    private readonly walletsService: WalletsService
    ) {}

  @ApiOperation({
    summary: 'get the wallet of a specific user.',
    description: 'this endpoint will get the wallet of a specific user.'
  })
  @ApiOkResponse({
    type: IVC.Wallet.History,
    isArray: false,
    status: 200,
    description: "Returns a HederaWalletHistory object."
  })
  @ApiParam({
    name: 'userId',
    required: true,
    type: 'string',
    description: 'The user id of the wallet to get.'
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Get(':userId')
  async getWallet(
    @Req() request,
    @Param('userId') userId: string
  ): Promise<I_IVC.IWallet.IHistory> {
    try {
      return await this.walletsService.getWallet(userId);
    } catch(error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get(':userId/tokens')
  @ApiOperation({ summary: 'Get tokens for a user wallet' })
  @ApiParam({
      name: 'userId',
      required: true,
      description: 'The ID of the user whose wallet tokens to retrieve'
  })
 
  @ApiResponse({
      status: 200,
      description: 'Tokens retrieved successfully'
  })
  @ApiResponse({
      status: 404,
      description: 'Wallet not found for user'
  })
  getToken(
      @Param('userId') userId: string,
   
  ): Promise<any> {
      return new Promise((resolve, reject) => {
          this.walletsService.getToken(userId)
              .then(result => {
                  resolve(result);
              })
              .catch(error => {
                  reject(error);
              });
      });
  }
  @Post()
  @ApiOperation({
    summary: 'create a wallet for a specific user.',
    description: 'this endpoint will create a wallet for a specific user.'
  })
  @ApiOkResponse({
    type: Wallet,
    isArray: false,
    status: 200,
    description: "Returns a Wallet object."
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        type: { type: 'string', enum: ['user', 'agent'], default: 'user' }
      },
      required: ['owner', 'type',]
    }
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  async createWallet(
    @Body() body: { owner: string; type?: 'user' | 'agent'; },
  ): Promise<{ wallet: Wallet, did: any }> {
    const { owner, type = 'user' } = body;
    if (!owner || !type) {
      throw new BadRequestException('Missing required fields: owner, type');
    }
    if (type !== 'user' && type !== 'agent') {
      throw new BadRequestException('Invalid wallet type. Must be "user" or "agent".');
    }
    if (type === 'user') {
      const existing = await this.walletsService.findOne({ owner, type: 'user' });
      if (existing) {
        throw new BadRequestException('A user wallet already exists for this owner.');
      }
    }
    // For agent, allow multiple wallets per owner
    return this.walletsService.createWallet({ userId: owner, type });
  }

  @ApiOperation({
    summary: 'delete a wallet for a specific user.',
    description: 'this endpoint will delete a wallet for a specific user.'
  })
  @ApiOkResponse({
    type: SmartNode.SmartTransaction.Details,
    isArray: false,
    status: 200,
    description: "Returns a SmartNode.SmartTransaction.Details."
  })
  @ApiBody({
    type: IVC.Wallet.Request.Delete,
    required: true
  })
  @ApiParam({
    name: 'userId',
    required: true,
    type: 'string',
    description: 'The userId to delete.'
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Delete(':userId')
  async deleteWallet(
    @Req() request,
    @Param('userId') userId: string,
    @Body() deleteWalletRequest: IVC.Wallet.Request.Delete
  ): Promise<ISmartNode.ISmartTransaction.IDetails> {
    try {
      return await this.walletsService.deleteWallet(
        userId,
        AccountId.fromString(deleteWalletRequest.transferAccountId)
      )
    } catch(error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({
    summary: 'associate a wallet to a token, for a specific user.',
    description: 'this endpoint will associate a token to a wallet, for a specific user.'
  })
  @ApiOkResponse({
    type: SmartNode.SmartTransaction.Details,
    isArray: false,
    status: 200,
    description: "Returns a SmartNode.SmartTransaction.Details object."
  })
  @ApiBody({
    type: IVC.Wallet.Request.Associate,
    required: true
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Post('associate/token')
  async associateToken(
    @Req() request,
    @Body() associateTokenRequest: IVC.Wallet.Request.Associate
  ): Promise<ISmartNode.ISmartTransaction.IDetails> {
    try {
      return await this.walletsService.associateToken(associateTokenRequest);
    } catch(error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({
    summary: 'dissociate a wallet to a token, for a specific user.',
    description: 'this endpoint will dissociate a wallet to a token, for a specific user.'
  })
  @ApiOkResponse({
    type: SmartNode.SmartTransaction.Details,
    isArray: false,
    status: 200,
    description: "Returns a SmartNode.SmartTransaction.Details object."
  })
  @ApiBody({
    type: IVC.Wallet.Request.Associate,
    required: true
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Post('dissociate/token')
  async dissociateToken(
    @Req() request,
    @Body() associateTokenRequest: IVC.Wallet.Request.Associate
  ): Promise<ISmartNode.ISmartTransaction.IDetails> {
    try {
      return await this.walletsService.dissociateToken(associateTokenRequest);
    } catch(error) {
      throw new BadRequestException(error.message);
    }
  }

  // @isTwoFactorAuth()
  @ApiOperation({
    summary: 'withdraw a specific token amount from the wallet , for a specific uer.',
    description: 'this endpoint will allow the admin to withdraw a specific token amount from the wallet , for a specific uer.'
  })
  @ApiOkResponse({
    type: IVC.Wallet.Response.Withdraw,
    isArray: false,
    status: 200,
    description: "Returns a WithdrawResponse object."
  })
  @ApiBody({
    type: IVC.Wallet.Request.Withdraw,
    required: true
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Post('withdraw/token')
  async withdrawToken(
    @Body() withdraw: IVC.Wallet.Request.Withdraw,
    @Req() request,
  ): Promise<I_IVC.IWallet.IResponse.IWithdraw> {
    try {
      return await this.walletsService.withdrawToken(withdraw);
    } catch(error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':ownerId/agents')
  @ApiOperation({ summary: 'Get all agent wallets for a given user/owner' })
  @ApiOkResponse({ type: [Wallet], description: 'Returns all agent wallets for the given owner/userId.' })
  @ApiParam({ name: 'ownerId', required: true, type: 'string', description: 'The owner/userId to fetch agent wallets for.' })
  async getAgentWallets(
    @Param('ownerId') ownerId: string
  ): Promise<Wallet[]> {
    //console.log('Fetching agent wallets for userId:', req);
    return this.walletsService.findAllAgents({ owner: ownerId, type: 'agent' });
  }

}
