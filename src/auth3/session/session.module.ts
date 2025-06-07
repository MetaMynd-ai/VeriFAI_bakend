import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

export const SESSION_REDIS = 'SESSION_REDIS';

@Global()
@Module({
  imports: [
    ConfigModule,
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
  exports: [SESSION_REDIS]
})
export class SessionModule {}
