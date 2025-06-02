import { IAuth, Auth } from '@hsuite/types';
import { UserSafe, UsersService } from '@hsuite/users';
import { Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
export declare class AuthWeb2Service {
    private authWeb2Options;
    private readonly jwtService;
    private usersService;
    private readonly mailerService;
    protected logger: Logger;
    constructor(authWeb2Options: IAuth.IConfiguration.IWeb2.IOptions & IAuth.IConfiguration.IOptions, jwtService: any, usersService: UsersService, mailerService: MailerService);
    validateUser(user: Auth.Credentials.Web2.Dto.Signup): Promise<UserSafe | null>;
    sendConfirmationEmail(userId: string, userEmail: string): Promise<boolean>;
    create(user: Auth.Credentials.Web2.Dto.Signup): Promise<UserSafe>;
    passwordRecoveryRequest(email: string): Promise<boolean>;
    passwordRecoveryReset(token: string, newPassword: string): Promise<boolean>;
    emailConfirmation(token: string): Promise<boolean>;
    login(user: Auth.Credentials.Web2.Dto.SessionLogin): Promise<IAuth.ICredentials.IWeb2.IResponse.ILogin>;
}
