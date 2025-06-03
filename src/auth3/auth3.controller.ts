import { Controller, Get, Req, BadRequestException, Post, Body, Res, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiBody } from '@nestjs/swagger';
import { Auth3Service } from './auth3.service';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { GlobalAuthGuard } from 'src/common/guards/global-auth.guard';
import { Public } from '@hsuite/decorators';

@ApiTags('auth3')
@Controller('auth3')
export class Auth3Controller {
  constructor(private readonly auth3Service: Auth3Service) {}
@Get('debug-session')
@Public()
async debug(@Req() req) {
  return { session: req.session, user: req.user , sessionID: req.sessionID, cookies: req.cookies, headers: req.headers };
}
  @Get('profile')
  @UseGuards(GlobalAuthGuard)
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
    console.log('Request user profile () contrl:', request);
    if (!request.user) {
      return { message: 'Not logged in' };
    }
    return request.user;
  }
 
  @Post('register')
  @ApiOperation({ summary: 'Register a new user with email and password.' })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ status: 200, description: 'Returns a user profile.' })
  @ApiBadRequestResponse()
  async register(@Req() request: any, @Body() credentials: RegisterDto) {
    try {
      if (!request.user) {
        return await this.auth3Service.register(credentials);
      } else {
        throw new BadRequestException('You are currently logged in. Please logout to create a new account.');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login with email and password.' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ status: 200, description: 'Returns a user profile.' })
  @ApiBadRequestResponse()
  async login(@Body() credentials: LoginDto, @Req() req, @Res() res: Response) {
    return this.auth3Service.login(credentials, req, res);
  }

  @Post('password/recovery/request')
  @ApiOperation({ summary: 'Send a password reset email to the user.' })
  @ApiOkResponse({ status: 200, description: 'Returns a Boolean.' })
  @ApiBadRequestResponse()
  async passwordRecoveryRequest(@Query('email') email: string) {
    return this.auth3Service.passwordRecoveryRequest(email);
  }

  @Post('password/recovery/reset')
  @ApiOperation({ summary: 'Reset the password of the user.' })
  @ApiOkResponse({ status: 200, description: 'Returns a Boolean.' })
  @ApiBadRequestResponse()
  async passwordRecoveryReset(@Query('token') token: string, @Query('newPassword') newPassword: string) {
    return this.auth3Service.passwordRecoveryReset(token, newPassword);
  }

  @Post('email/confirm')
  @ApiOperation({ summary: 'Confirm the email of the user.' })
  @ApiOkResponse({ status: 200, description: 'Returns a Boolean.' })
  @ApiBadRequestResponse()
  async emailConfirmation(@Query('token') token: string) {
    return this.auth3Service.emailConfirmation(token);
  }

  @Post('email/confirm/request')
  @ApiOperation({ summary: 'Send a confirmation email to the user.' })
  @ApiOkResponse({ status: 200, description: 'Returns a Boolean.' })
  @ApiBadRequestResponse()
  async emailConfirmationRequest(@Req() request: any) {
    return this.auth3Service.sendConfirmationEmail(request.user._id, request.user.email);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout the user.' })
  @ApiOkResponse({ status: 200, description: 'Returns a Boolean.' })
  @ApiBadRequestResponse()
  async logout(@Req() req, @Res() res: Response) {
    return this.auth3Service.logout(req, res);
  }
}
