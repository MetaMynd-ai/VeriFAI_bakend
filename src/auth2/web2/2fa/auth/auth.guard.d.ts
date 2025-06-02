import { CanActivate, ExecutionContext } from '@nestjs/common';
import { TwoFactoryAuthService } from '../2fa.service';
import { Reflector } from '@nestjs/core';
export declare class TwoFactoryAuthGuard implements CanActivate {
    private twoFactoryAuthService;
    private reflector;
    constructor(twoFactoryAuthService: TwoFactoryAuthService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
