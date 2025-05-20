import { 
  BadRequestException, 
  Body, 
  Controller, 
  Get, 
  Param, 
  Post, 
  Put, 
  Req 
} from '@nestjs/common';
import { 
  ApiBadRequestResponse, 
  ApiBody, 
  ApiNotFoundResponse, 
  ApiOkResponse, 
  ApiOperation, 
  ApiParam, 
  ApiTags 
} from '@nestjs/swagger';
import { IssuersService } from './issuers.service';
import { IDIssuer } from './entities/issuer.entity';
import { IssuerPayload } from './payloads/issuer.payload';

@Controller('issuers')
@ApiTags('issuers')
export class IssuersController {
  constructor(private readonly issuersService: IssuersService) {}

  @ApiOperation({
    summary: 'fetch the list of Issuers from the logged session.',
    description: 'this endpoint will return the list of Issuers from the logged in session.'
  })
  @ApiOkResponse({
    type: IDIssuer,
    isArray: true,
    status: 200,
    description: "Returns an array of IDIssuer objects."
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Get()
  async getIssuers(
    @Req() request
  ): Promise<Array<IDIssuer>> {
    try {
      return await this.issuersService.getIssuers(request.user._id);
    } catch(error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({
    summary: 'add a new Issuer to the logged session.',
    description: 'this endpoint will add a new Issuer to the logged in session.'
  })
  @ApiOkResponse({
    type: IDIssuer,
    isArray: false,
    status: 200,
    description: "Returns the newly created IDIssuer object."
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  @Post()
  async createIssuer(
    @Req() request,
    @Body() issuer: IssuerPayload
  ): Promise<IDIssuer> {
    try {
      return await this.issuersService.createIssuer(request.user._id, issuer);
    } catch(error) {
      throw new BadRequestException(error.message);
    }
  }
}
