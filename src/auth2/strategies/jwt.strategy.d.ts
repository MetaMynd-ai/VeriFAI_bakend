import { Strategy } from 'passport-jwt';
import { IAuth } from '@hsuite/types';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private authOptions;
    constructor(authOptions: IAuth.IConfiguration.IAuthentication);
    validate(payload: any): Promise<any>;
    private static fromCookiesInBrowser;
}
export {};
