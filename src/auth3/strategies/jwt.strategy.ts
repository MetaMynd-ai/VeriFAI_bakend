import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Define an interface for the object returned by validate,
// which will be attached to request.user by Passport after JWT validation.
export interface AuthenticatedUserPayload {
  userId: string; // This will be mapped from JWT's payload.sub
  username: string;
  role: string;
  // Add other properties from the JWT payload if they are included and useful
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) { // Default strategy name is 'jwt'
  constructor(
    private readonly configService: ConfigService,
    // Optionally inject Auth3Service if you need to validate user against DB on each JWT validation
    // private readonly auth3Service: Auth3Service,
    
  ) {
    const secret = configService.get<string>('auth.commonOptions.jwt.secret'); // Updated path
    
    if (!secret) {
      // This will give a clearer error if the JWT_SECRET is not found in the config
      throw new InternalServerErrorException('JWT secret is not defined in the configuration. Please check your .env file and authentication config. Expected at "auth.commonOptions.jwt.secret"');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Or from cookies, etc.
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any): Promise<AuthenticatedUserPayload> {
    console.log('JWT Strategy: Validating payload:', payload);
    // Payload is the decoded JWT.
    // It should contain user identifier (e.g., sub or userId) and other claims.
    // The GlobalAuthGuard will use this userId to fetch the full user from DB.
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid JWT payload: "sub" field (user ID) is missing');
    }
    if (typeof payload.username !== 'string') {
        throw new UnauthorizedException('Invalid JWT payload: "username" field is missing or not a string');
    }
    if (typeof payload.role !== 'string') {
        throw new UnauthorizedException('Invalid JWT payload: "role" field is missing or not a string');
    }

    // Map JWT payload fields to our AuthenticatedUserPayload interface.
    // 'payload.sub' typically holds the user's unique identifier.
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
