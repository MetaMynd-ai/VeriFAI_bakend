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
    type: IVC.Wallet.Request.Create,
    required: true
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Post()
  async createWallet(
    @Req() request,
    @Body() createWalletRequest: IVC.Wallet.Request.Create
  ): Promise<Wallet> {
    try {
      return await this.walletsService.createWallet(createWalletRequest)
    } catch(error) {
      throw new BadRequestException(error.message);
    }
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

  


}
