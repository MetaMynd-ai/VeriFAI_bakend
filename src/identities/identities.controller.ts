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
    summary: 'fetch the DID for a given ownerID.',
    description: 'this endpoint will fetch the DID for a given ownerID.'
  })
  @ApiOkResponse({
    type: Object,
    isArray: false,
    status: 200,
    description: "Returns a Object object."
  })
  @ApiParam({
    name: 'ownerId',
    required: true,
    type: 'string',
    description: 'The ownerId you want to fetch the DID for.'
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Get(':ownerId')
  async fetchDID(
    @Req() request,
    @Param('ownerId') ownerId: string
  ): Promise<{
    identity: IdentityDocument,
    did: Hedera.DID.Document.Info
  }> {
    try {
      return await this.identitiesService.fetchDID(ownerId);
    } catch(error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({
    summary: 'create a DID for a given OwnerId.',
    description: 'this endpoint will create a DIDfor a given OwnerId.'
  })
  @ApiOkResponse({
    type: Identity,
    isArray: false,
    status: 200,
    description: "Returns a Identity object."
  })
  @ApiParam({
    name: 'ownerId',
    required: true,
    type: 'string',
    description: 'The OwnerId you want to create a DID for. It can be a userId or an angent\'s accountId.'
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Post(':ownerId')
  async createDID(
    @Req() request,
    @Param('ownerId') ownerId: string
  ): Promise<Identity> {
    try {
      return await this.identitiesService.createDID(ownerId);
    } catch(error) {
      throw new BadRequestException(error.message);
    }
  }
}
