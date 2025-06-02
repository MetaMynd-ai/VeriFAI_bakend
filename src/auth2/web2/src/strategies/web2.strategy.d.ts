/// <reference types="cookie-parser" />
import { Strategy } from "passport-custom";
import { AuthWeb2Service } from "../auth/web2.service";
import { Request } from 'express';
import { UserSafe } from '@hsuite/users';
import { IAuth } from '@hsuite/types';
declare const Web2Strategy_base: new (...args: any[]) => Strategy;
export declare class Web2Strategy extends Web2Strategy_base {
    private authWeb2Options;
    private web2Service;
    constructor(authWeb2Options: IAuth.IConfiguration.IWeb2.IOptions, web2Service: AuthWeb2Service);
    validate(request: Request): Promise<UserSafe | null>;
}
export {};
