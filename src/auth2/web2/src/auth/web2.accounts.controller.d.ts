import { AuthWeb2Service } from './web2.service';
import { UserSafe } from '@hsuite/users';
import { IAuth, Auth } from '@hsuite/types';
export declare class AuthWeb2AccountsController {
    private authWeb2Options;
    private readonly web2Service;
    constructor(authWeb2Options: IAuth.IConfiguration.IWeb2.IOptions, web2Service: AuthWeb2Service);
    register(request: any, credentials: Auth.Credentials.Web2.Dto.Signup): Promise<UserSafe>;
    passwordRecoveryRequest(email?: string): Promise<boolean>;
    passwordRecoveryReset(token?: string, newPassword?: string): Promise<boolean>;
    emailConfirmation(token: string): Promise<boolean>;
    emailConfirmationRequest(request: any): Promise<boolean>;
}
