import { DynamicModule, MiddlewareConsumer } from '@nestjs/common';
import { createClient } from 'redis';
interface IAuthRedis {
    client: typeof createClient;
    cookieOptions: any;
    appName: string;
}
export declare class AuthModule {
    private readonly redis;
    constructor(redis: IAuthRedis);
    static forRootAsync(options: any): Promise<DynamicModule>;
    configure(consumer: MiddlewareConsumer): void;
}
export {};
