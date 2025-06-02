import { TwoFactoryAuthService } from './2fa.service';
import { IAuth } from '@hsuite/types';
export declare class TwoFactoryAuthController {
    private readonly twoFactoryAuthService;
    constructor(twoFactoryAuthService: TwoFactoryAuthService);
    verifyFactor(request: any): Promise<IAuth.ITwoFactor.IResponse.ICreate>;
    deleteFactor(code: string, request: any): Promise<IAuth.ITwoFactor.IResponse.IDelete>;
    createFactor(code: string, request: any): Promise<IAuth.ITwoFactor.IResponse.IVerify>;
    createChallenge(code: string, request: any): Promise<IAuth.ITwoFactor.IResponse.IVerify>;
}
