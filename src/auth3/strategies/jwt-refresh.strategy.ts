import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface RefreshTokenPayload {
  userId: string;
  username: string;
  // Add other properties if needed in your refresh token payload
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    const refreshSecret = configService.get<string>('auth.commonOptions.jwtRefresh.secret');
    if (!refreshSecret) {
      throw new InternalServerErrorException('JWT_REFRESH_SECRET is not defined. Expected at "auth.commonOptions.jwtRefresh.secret"');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refreshToken; // Assuming refresh token is in a cookie named 'refreshToken'
        },
      ]),
      secretOrKey: refreshSecret,
      passReqToCallback: true, // Pass request to validate method to access the token itself if needed
    });
  }

  async validate(req: Request, payload: any): Promise<RefreshTokenPayload & { refreshToken: string }> {
    const refreshToken = req.cookies?.refreshToken;
    if (!payload || !payload.sub || !refreshToken) {
      throw new UnauthorizedException('Invalid refresh token or payload');
    }
    // 'sub' from payload is userId
    return { userId: payload.sub, username: payload.username, refreshToken };
  }
}
