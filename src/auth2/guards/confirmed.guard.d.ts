import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IAuth } from '@hsuite/types';
import { UsersService } from '@hsuite/users';
export declare class ConfirmedAuthGuard implements CanActivate {
    private reflector;
    private usersService;
    private authOptions;
    constructor(reflector: Reflector, usersService: UsersService, authOptions: IAuth.IConfiguration.IWeb2.IOptions);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
