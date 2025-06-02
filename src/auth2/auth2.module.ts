import { Module } from '@nestjs/common';
import { Auth2Controller } from './auth2.controller';
import { Auth2Service } from './auth2.service';
// Import any other modules/services you need (e.g., PassportModule, JwtModule, Redis, etc.)

@Module({
  imports: [
    // Add PassportModule, JwtModule, RedisModule, UserModule, etc. as needed
  ],
  controllers: [Auth2Controller],
  providers: [Auth2Service],
  exports: [Auth2Service],
})
export class Auth2Module {}
