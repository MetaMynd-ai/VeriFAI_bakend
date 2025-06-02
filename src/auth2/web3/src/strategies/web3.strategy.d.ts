/// <reference types="cookie-parser" />
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthWeb3Service } from '../auth/web3.service';
declare const Web3Strategy_base: new (...args: any[]) => Strategy;
export declare class Web3Strategy extends Web3Strategy_base {
    private web3Service;
    constructor(web3Service: AuthWeb3Service);
    validate(request: Request): Promise<any>;
}
export {};
