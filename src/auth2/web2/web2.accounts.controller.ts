import { Controller, Post, Body, Req, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiNotFoundResponse, ApiBadRequestResponse } from '@nestjs/swagger';
// import { UserSafe } from '../../users/user-safe.entity'; // Adjust as needed
import { Web2Service } from './web2.service';

@ApiTags('auth2/web2')
@Controller('auth2/web2')
export class Web2AccountsController {
  constructor(private readonly web2Service: Web2Service) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user with email and password.',
    description: 'This endpoint is always open and does not require authentication. It is used to create a new user in the database. The user will be able to login with the credentials provided.'
  })
  @ApiBody({ type: Object }) // Replace with your SignupDto
  @ApiOkResponse({
    // type: UserSafe, // Uncomment and adjust if you have a UserSafe DTO/entity
    status: 200,
    description: 'Returns a UserSafe.'
  })
  @ApiNotFoundResponse()
  @ApiBadRequestResponse()
  async register(@Req() request: any, @Body() credentials: any) {
    try {
      if (!request.user) {
        return await this.web2Service.create(credentials);
      } else {
        throw new BadRequestException('You are currently logged in. Please logout to create a new account.');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Add other endpoints (password recovery, email confirmation, etc.) here as needed
}
