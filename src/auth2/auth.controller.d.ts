import { UserSafe } from '@hsuite/users';
import { AuthService } from './auth.service';
import { Auth } from '@hsuite/types';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    profile(request: any): Promise<UserSafe | Auth.Credentials.Web3.Entity | Auth.Credentials.Web3.Response.Login>;
}
