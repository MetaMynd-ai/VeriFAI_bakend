import { DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { ConsoleModule } from 'nestjs-console';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';
import { Config } from 'cache-manager';
import { WalletsModule } from './wallets/wallets.module';
import { ApiKeyModule } from '@hsuite/api-key';
import { SecurityThrottlerModule } from '@hsuite/throttler';
import { IHedera } from '@hsuite/types';
import { LedgerId } from '@hashgraph/sdk';
import { ClientModule } from '@hsuite/client';
import { IpfsResolverModule, IpfsResolverService } from '@hsuite/ipfs-resolver';
import { IdentitiesModule } from './identities/identities.module';
import { IssuersModule } from './issuers/issuers.module';
import { BalanceModule } from './balance/balance.module';
import { HcsModule } from './hcs/hcs.module';
import { HtsModule } from './hts/hts.module';
import { AgentProfileModule } from './agent-profile/agent-profile.module';
import { Auth3Module } from './auth3/auth3.module';


import testnet from '../config/settings/testnet';
import mainnet from '../config/settings/mainnet';
import modules from '../config/settings/modules';
import authentication from '../config/settings/authentication';
import configuration from '../config/configuration';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.smart_app.env',
      load: [configuration, authentication, testnet, mainnet, modules]
    }),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore(configService.get<RedisClientOptions & Config>('redis'))
      })
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(
          `${configService.get<string>('environment')}.mongodbUrl`
        )
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: true,
      removeListener: true,
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '../public'),
      serveRoot: '/public/',
      exclude: ["/api*"],
    }),
    ConsoleModule,
    HtsModule,
    HcsModule,
    LoggerModule,
    AgentProfileModule,
    Auth3Module
  ],
  controllers: [
    AppController
  ],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ]
})
export class AppModule {

  static register(): DynamicModule {
    return {
      module: AppModule,
      imports: [
        // Smart Node - Core Modules
        IpfsResolverModule,
        WalletsModule,
        IssuersModule,
        IdentitiesModule,
        BalanceModule,
        HtsModule,
        HcsModule,
        LoggerModule,
        SecurityThrottlerModule.forRoot(),  
        ClientModule.forRootAsync({
          imports: [ConfigModule],
          useExisting: ConfigService,
          useFactory: async (configService: ConfigService) => ({
            environment: LedgerId.fromString(configService.get<string>(
              'client_environment'
            )),
            operator: configService.get<IHedera.IOperator>(
              `${configService.get<string>('environment')}.node`
            ),
            nodes: configService.get<IHedera.IOperator>(
              `${configService.get<string>('environment')}.nodes`
            )
          })
        }),         
        ...(
          modules().modules.ApiKeyModule.enabled ?
            [
              ApiKeyModule
            ] : []
        )
      ],
      providers: []
    };
  }
}
