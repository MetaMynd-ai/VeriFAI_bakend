import { Controller, Get, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth2Service } from './auth2.service';

@ApiTags('auth2')
@Controller('auth2')
export class Auth2Controller {
  constructor(private readonly auth2Service: Auth2Service) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get the profile of a user from the session.',
    description: 'This endpoint is only available if the user is authenticated. It will return the profile of the user from the session.'
  })
  @ApiOkResponse({
    status: 200,
    description: 'Returns a user profile.'
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  async profile(@Req() request: any) {
    try {
      return await this.auth2Service.profile(request.user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
