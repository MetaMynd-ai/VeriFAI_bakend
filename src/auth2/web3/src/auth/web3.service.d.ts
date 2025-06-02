import { IAuth, Auth, ISmartNode } from '@hsuite/types';
import { IpfsResolverService } from '@hsuite/ipfs-resolver';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class AuthWeb3Service {
    private readonly authWeb3Options;
    private readonly jwtService;
    private configService;
    private httpService;
    private readonly ipfsResolverService;
    private environment;
    private baseUrl;
    constructor(authWeb3Options: IAuth.IConfiguration.IWeb3.IOptions & IAuth.IConfiguration.IOptions, jwtService: any, configService: ConfigService, httpService: HttpService, ipfsResolverService: IpfsResolverService);
    getOperatorId(): string;
    generateToken(): string;
    validateWallet(payload: Auth.Credentials.Web3.Request.Signin.Login): Promise<IAuth.ICredentials.IWeb3.IResponse.ILogin | null>;
    private fetchTokenGateInfos;
    login(user: IAuth.ICredentials.IWeb3.IResponse.ILogin, payload: IAuth.ICredentials.IWeb3.IRequest.ISignin.ILogin): Promise<IAuth.ICredentials.IWeb3.IResponse.ILogin>;
    validateSignature(signedData: any, operator: ISmartNode.IOperator): Promise<boolean>;
    signData(data: Auth.Credentials.Web3.Request.Authentication.Payload): Auth.Credentials.Web3.Request.Authentication.SignedData;
    verifyData(data: any, publicKey: string, signature: Uint8Array): boolean;
}
