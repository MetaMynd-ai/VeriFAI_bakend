import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt'; // Import JwtModule
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigModule and ConfigService
import { User, UserSchema } from './entities/user.entity';
import { Auth3Controller } from './auth3.controller';
import { Auth3Service } from './auth3.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy'; // Import JwtStrategy from local path
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy'; // Import JwtRefreshStrategy

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }), // Ensure PassportModule is configured
    ConfigModule, // Make ConfigModule available for JwtModule.registerAsync
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule here as well for useFactory
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('auth.commonOptions.jwt.secret'), // Updated path
        signOptions: {
          expiresIn: configService.get<string>('auth.commonOptions.jwt.signOptions.expiresIn', '3600s'), // Updated path
        },
      }),
      inject: [ConfigService],
    }),
    // AuthModule, // Remove the import for the old AuthModule
  ],
  controllers: [Auth3Controller],
  providers: [
    Auth3Service,
    LocalStrategy,
    JwtStrategy, // Add JwtStrategy to providers
    JwtRefreshStrategy, // Add JwtRefreshStrategy
  ],
  exports: [Auth3Service, MongooseModule, JwtModule, PassportModule], // Export JwtModule and PassportModule
})
export class Auth3Module {}