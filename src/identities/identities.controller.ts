import { 
  BadRequestException,
  Controller, 
  Get, 
  Param, 
  Post, 
  Req 
} from '@nestjs/common';
import { 
  ApiBadRequestResponse, 
  ApiNotFoundResponse, 
  ApiOkResponse, 
  ApiOperation, 
  ApiParam, 
  ApiTags
} from '@nestjs/swagger';
import { IdentitiesService } from './identities.service';
import { Identity, IdentityDocument } from './entities/identity.entity';
import { Hedera, IHedera } from '@hsuite/types';

@Controller()
@ApiTags('identities')
export class IdentitiesController {
  constructor(private readonly identitiesService: IdentitiesService) {}

  @ApiOperation({
    summary: 'fetch the DID for a given userID.',
    description: 'this endpoint will fetch the DID for a given userID.'
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
    description: 'The userId you want to fetch the DID for.'
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Get(':userId')
  async fetchDID(
    @Req() request,
    @Param('userId') userId: string
  ): Promise<{
    identity: IdentityDocument,
    did: Hedera.DID.Document.Info
  }> {
    try {
      return await this.identitiesService.fetchDID(userId);
    } catch(error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({
    summary: 'create a DID for a given userID.',
    description: 'this endpoint will create a DIDfor a given userID.'
  })
  @ApiOkResponse({
    type: Identity,
    isArray: false,
    status: 200,
    description: "Returns a Identity object."
  })
  @ApiParam({
    name: 'userId',
    required: true,
    type: 'string',
    description: 'The userId you want to create a DID for.'
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Post(':userId')
  async createDID(
    @Req() request,
    @Param('userId') userId: string
  ): Promise<Identity> {
    try {
      return await this.identitiesService.createDID(userId);
    } catch(error) {
      throw new BadRequestException(error.message);
    }
  }
}
