import { Controller, Get, Req, BadRequestException, Post, Body, Res, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiBody } from '@nestjs/swagger';
import { Auth3Service } from './auth3.service';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { GlobalAuthGuard } from 'src/common/guards/global-auth.guard';
import { Public } from '@hsuite/decorators';
import { User } from './entities/user.entity'; // Assuming User entity is used for typing req.user
import { AuthenticatedUserPayload } from './strategies/jwt.strategy'; // For typing req.user on protected routes
import { RefreshTokenPayload } from './strategies/jwt-refresh.strategy'; // For typing req.user on refresh route

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
  @Public()
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
  @UseGuards(AuthGuard('local')) // This guard triggers your LocalStrategy
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: { user: User }, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, user } = await this.auth3Service.login(req.user);
    
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development', // true in production
      sameSite: 'lax', // Or 'strict' or 'none' (if 'none', secure must be true)
      // path: '/', // Optional: cookie path
      // maxAge: 7 * 24 * 60 * 60 * 1000, // Optional: cookie expiry (matches refresh token expiry)
      // domain: 'yourdomain.com' // Optional: set your domain in production
    });

    return { accessToken, user };
  }

  @UseGuards(AuthGuard('jwt-refresh')) // Use the new refresh guard
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Request() req: { user: RefreshTokenPayload & { refreshToken: string } }, @Res({ passthrough: true }) response: Response) {
    // req.user is populated by JwtRefreshStrategy and includes userId and the original refreshToken
    const { accessToken, newRefreshToken } = await this.auth3Service.refreshTokens(req.user.userId, req.user.refreshToken);
    
    response.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
    });
    
    return { accessToken };
  }
  
  @UseGuards(AuthGuard('jwt')) // Protected by access token
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: { user: AuthenticatedUserPayload }, @Res({ passthrough: true }) response: Response) {
    await this.auth3Service.logout(req.user.userId);
    response.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'lax',
    });
    return { message: 'Logged out successfully' };
  }
}
