import { Auth } from '@hsuite/types';
import { UserSafe, UsersService } from '@hsuite/users';
export declare class AuthService {
    private usersService;
    constructor(usersService: UsersService);
    profile(user: any): Promise<UserSafe | Auth.Credentials.Web3.Entity | Auth.Credentials.Web3.Response.Login>;
}
