import { IAuth } from '@hsuite/types';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
declare const Web2AuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class Web2AuthGuard extends Web2AuthGuard_base {
    private authWeb2Options;
    private reflector;
    constructor(authWeb2Options: IAuth.IConfiguration.IWeb2.IOptions & IAuth.IConfiguration.IOptions, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    handleRequest(err: any, user: any, info: any): any;
}
export {};
