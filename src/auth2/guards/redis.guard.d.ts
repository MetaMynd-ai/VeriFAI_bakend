import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
declare const RedisAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class RedisAuthGuard extends RedisAuthGuard_base {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<any>;
    handleRequest(err: any, user: any, info: any): any;
}
export {};
