import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class AdminAuthGuard implements CanActivate {
    constructor();
    canActivate(context: ExecutionContext): Promise<boolean>;
}
