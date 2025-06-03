import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import { JwtModule } from '@nestjs/jwt';

export const SESSION_REDIS = 'SESSION_REDIS';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('auth.commonOptions.jwt'),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: SESSION_REDIS,
      useFactory: async (configService: ConfigService) => {
        const redisConfig = configService.get('auth.commonOptions.redis');
        const cookieOptions = configService.get('auth.commonOptions.cookieOptions');
        const client = createClient({
          url: `redis://:${redisConfig.password}@${redisConfig.socket.host}:${redisConfig.socket.port}`,
          legacyMode: false
        });
        await client.connect();
        return {
          client,
          cookieOptions,
          sessionMiddleware: session({
            store: new RedisStore({ client: client as any }),
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: cookieOptions
          })
        };
      },
      inject: [ConfigService]
    }
  ],
  exports: [SESSION_REDIS, JwtModule]
})
export class SessionModule {}
