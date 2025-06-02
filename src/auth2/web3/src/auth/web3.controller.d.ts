import { AuthWeb3Service } from './web3.service';
import { Auth, IAuth } from '@hsuite/types';
export declare class AuthWeb3Controller {
    private authWeb3Options;
    private readonly web3Service;
    constructor(authWeb3Options: IAuth.IConfiguration.IWeb3.IOptions & IAuth.IConfiguration.IOptions, web3Service: AuthWeb3Service);
    request(request: any): Promise<Auth.Credentials.Web3.Request.Authentication.Authenticate>;
    login(credentials: Auth.Credentials.Web3.Request.Signin.Login, response: any, request: any): Promise<IAuth.ICredentials.IWeb3.IResponse.ILogin>;
    logout(request: any, response: any): Promise<IAuth.ICredentials.IWeb3.IResponse.ILogout>;
}
