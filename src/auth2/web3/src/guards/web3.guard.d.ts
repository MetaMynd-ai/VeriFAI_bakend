import { IAuth } from '@hsuite/types';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
declare const Web3AuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class Web3AuthGuard extends Web3AuthGuard_base {
    private authWeb3Options;
    private reflector;
    constructor(authWeb3Options: IAuth.IConfiguration.IWeb3.IOptions & IAuth.IConfiguration.IOptions, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    handleRequest(err: any, user: any, info: any): any;
}
export {};
