import { UsersService } from '@hsuite/users';
import { IAuth } from '@hsuite/types';
export declare class TwoFactoryAuthService {
    private usersService;
    private twilioOptions;
    private client;
    constructor(usersService: UsersService, twilioOptions: IAuth.ITwilio.IOptions);
    isEnabled(userId: string): Promise<boolean>;
    createFactor(userId: string): Promise<IAuth.ITwoFactor.IResponse.ICreate>;
    deleteFactor(code: string, userId: string): Promise<IAuth.ITwoFactor.IResponse.IDelete>;
    verifyFactor(userId: string, code: string): Promise<IAuth.ITwoFactor.IResponse.IVerify>;
    createChallenge(userId: string, code: string): Promise<IAuth.ITwoFactor.IResponse.IVerify>;
}
