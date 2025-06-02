import { AuthWeb2Service } from './web2.service';
import { Auth } from '@hsuite/types';
import { IAuth } from '@hsuite/types';
export declare class AuthWeb2SessionController {
    private authWeb2Options;
    private readonly web2Service;
    constructor(authWeb2Options: IAuth.IConfiguration.IWeb2.IOptions & IAuth.IConfiguration.IOptions, web2Service: AuthWeb2Service);
    login(credentials: Auth.Credentials.Web2.Dto.SessionLogin, response: any): Promise<IAuth.ICredentials.IWeb2.IResponse.ILogin>;
    logout(request: any, response: any): Promise<IAuth.ICredentials.IWeb2.IResponse.ILogout>;
}
