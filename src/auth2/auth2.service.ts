import { Injectable } from '@nestjs/common';

@Injectable()
export class Auth2Service {
  async profile(user: any) {
    // Return the user profile from the session
    // You can customize this to return a safe user DTO
    return user;
  }
}
