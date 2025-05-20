import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { CredentialsService } from './credentials.service';
import { ChainVCStatus, IDCredential, IDCredentialDocument } from './entities/credential.entity';
import { Verifiable, W3CCredential } from "did-jwt-vc"
import { Hedera } from '@hsuite/types';

export class VCStatusChange {
  @ApiProperty({
    type: String,
    enum: ChainVCStatus,
    description: "The VC status change"
  })
  status: ChainVCStatus
}

export class VCIssuerMetadataPayload {
  @ApiProperty({
    type: String,
    description: "The metadata for the VC NFT base64 encoded"
  })
  base64metadata: string

  @ApiProperty({
    type: String,
    description: "The expiration date of the VC, in unix timestamp format"
  })
  expiration_date: string
}

@Controller()
@ApiTags('identities')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) { }

  @ApiOperation({
    summary: 'create a VC for a given userID.',
    description: `this endpoint will issue a VC for a given userID. 
      </br>The VC Issuer will be the logged in user executing the request.
      </br>The logged in user must have a 'issuer' (or 'admin') role to execute this request, and must be whitelisted to issue a VC.`
  })
  @ApiOkResponse({
    type: IDCredential,
    isArray: false,
    status: 200,
    description: "Returns a IDCredential object."
  })
  @ApiParam({
    name: 'userId',
    required: true,
    type: 'string',
    description: 'The userId you want to issue a VC for.'
  })
  @ApiParam({
    name: 'issuerId',
    required: true,
    type: 'string',
    description: 'The issuerId of the VC.'
  })
  @ApiBody({
    type: VCIssuerMetadataPayload,
    isArray: false,
    description: "The VCIssuerMetadataPayload body"
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Post(':issuerId/:userId')
  async issueVC(
    @Req() request,
    @Param('userId') userId: string,
    @Param('issuerId') issuerId: string,
    @Body() payload: VCIssuerMetadataPayload
  ): Promise<IDCredential> {
    try {
      // the payload is base64 encoded, this is an example of how to encode it correctly 
      // before passing it to the service.
      // let objJsonStr = JSON.stringify(payload.base64metadata);
      // let objJsonB64 = Buffer.from(objJsonStr).toString("base64");
      // eyJvd25lciI6Iml0J3MgbWUiLCJ3b25kZXJmdWwiOmZhbHNlLCJvdGhlcnMiOlt7ImxvdmVseSI6Im5vcCIsImFnZSI6MjR9LHsibG92ZWx5IjoieWVzIiwiYWdlIjoyOH1dfQ==

      return await this.credentialsService.issueVC(request.user._id, userId, issuerId, payload.base64metadata, payload.expiration_date);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({
    summary: 'fetch a VC status for a given userID.',
    description: `this endpoint will fetch a VC for a given userID. 
    </br>The VC Issuer will be the logged in user executing the request.
    </br>The logged in user must have a 'issuer' (or 'admin') role to execute this request, and must be whitelisted to issue a VC.
    </br>If the logged in user is a 'admin' role, they can fetch any VC.`
  })
  @ApiOkResponse({
    type: Object,
    isArray: false,
    status: 200,
    description: "Returns a Object object."
  })
  @ApiParam({
    name: 'userId',
    required: true,
    type: 'string',
    description: 'The userId you want to retrieve a VC for.'
  })
  @ApiParam({
    name: 'issuerId',
    required: true,
    type: 'string',
    description: 'The issuerId of the VC.'
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Get(':issuerId/:userId')
  async fetchVC(
    @Req() request,
    @Param('userId') userId: string,
    @Param('issuerId') issuerId: string
  ): Promise<Array<{
    credential: IDCredentialDocument,
    verifiableCredential: Verifiable<W3CCredential>
  }>> {
    try {
      return await this.credentialsService.fetchVC(request.user, userId, issuerId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({
    summary: 'fetch a VC status for a given userID.',
    description: 'this endpoint will fetch a VC status for a given userID.'
  })
  @ApiOkResponse({
    type: Object,
    isArray: false,
    status: 200,
    description: "Returns a Verifiable<W3CCredential> object."
  })
  @ApiParam({
    name: 'userId',
    required: true,
    type: 'string',
    description: 'The userId you want to retrieve a VC for.'
  })
  @ApiParam({
    name: 'issuerId',
    required: true,
    type: 'string',
    description: 'The issuerId of the VC.'
  })
  @ApiBody({
    type: Hedera.DID.VC.StatusChange,
    isArray: false,
    description: "The status change object."
  })
  @ApiQuery({ name: 'wipeNFT', required: false, type: Boolean, description: 'Wipe NFT WithOut Change VC' })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Put(':issuerId/:userId/:credetialId')
  async changeVCStatus(
    @Req() request,
    @Param('userId') userId: string,
    @Param('issuerId') issuerId: string,
    @Param('credetialId') credetialId: string,
    @Body() payload: VCStatusChange,
    @Query('wipeNFT') wipeNFT?: string
  ): Promise<{ _id: string, chain_status: string; internal_status: string }> {
    const wipeNFTWithOutChangeVC = wipeNFT === 'true';
    try {
      return await this.credentialsService.changeVCStatus(request.user._id, userId, issuerId, credetialId, payload,wipeNFTWithOutChangeVC);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
