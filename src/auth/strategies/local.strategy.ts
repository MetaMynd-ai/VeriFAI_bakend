import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service'; // Adjust path if necessary
import { LoginDto } from '../dto/login.dto'; // Assuming LoginDto has email, username, and password
import { Request } from 'express'; // Import Request from express

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email_or_username', // Update to match the DTO field name for Passport's default extraction
      passReqToCallback: true, 
    });
  }

  // The second argument 'usernameInput' will be the value of the field specified in 'usernameField'.
  // The third argument 'passwordInput' will be the value of the password field.
  // We will still use loginDtoFromRequest for clarity and to ensure we get the whole DTO.
  async validate(req: Request, usernameInput: string, passwordInput: string): Promise<any> {
    const loginDtoFromRequest = req.body as LoginDto;
    console.log('Login DTO from request localStrategy:', loginDtoFromRequest);

    // Ensure the DTO from the body contains email_or_username and password.
    // This should ideally be guaranteed by a ValidationPipe on the controller using DTO validation.
    if (!loginDtoFromRequest.email_or_username || !loginDtoFromRequest.password) {
      throw new UnauthorizedException('Missing credentials. "email_or_username" and "password" are required.');
    }

    // Pass the complete DTO from the request body to the service for validation.
    const user = await this.authService.validateUser(loginDtoFromRequest);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // The validateUser method in Auth3Service should return the user object without the password
    // or handle the password comparison itself and return the user or null.
    console.log('User validated:', user);
    return user; // Passport will attach this to request.user if LocalAuthGuard is used on a route
    
  }
}
