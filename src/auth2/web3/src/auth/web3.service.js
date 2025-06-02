"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthWeb3Service = void 0;
const common_1 = require("@nestjs/common");
const sdk_1 = require("@hashgraph/sdk");
const ipfs_resolver_1 = require("@hsuite/ipfs-resolver");
const crypto = require("crypto");
const lodash = require("lodash");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
let AuthWeb3Service = class AuthWeb3Service {
    constructor(authWeb3Options, jwtService, configService, httpService, ipfsResolverService) {
        this.authWeb3Options = authWeb3Options;
        this.jwtService = jwtService;
        this.configService = configService;
        this.httpService = httpService;
        this.ipfsResolverService = ipfsResolverService;
        this.baseUrl = {
            mainnet: 'https://mainnet-public.mirrornode.hedera.com/api/v1/',
            testnet: 'https://testnet.mirrornode.hedera.com/api/v1/'
        };
        this.environment = sdk_1.LedgerId.fromString(this.configService.get('environment'));
        switch (this.environment) {
            case sdk_1.LedgerId.MAINNET:
                this.httpService.axiosRef.defaults.baseURL = this.baseUrl.mainnet;
                break;
            case sdk_1.LedgerId.TESTNET:
            case sdk_1.LedgerId.LOCAL_NODE:
                this.httpService.axiosRef.defaults.baseURL = this.baseUrl.testnet;
                break;
        }
    }
    getOperatorId() {
        return this.authWeb3Options.operator.accountId;
    }
    generateToken() {
        var token = crypto.randomBytes(64).toString('hex');
        return token;
    }
    async validateWallet(payload) {
        return new Promise(async (resolve, reject) => {
            try {
                let isValid = await this.validateSignature(payload.signedData, payload.operator);
                if (isValid) {
                    try {
                        let session = {
                            walletId: payload.operator.accountId,
                            publicKey: payload.operator.publicKey,
                            balance: await this.fetchTokenGateInfos(payload.operator.accountId)
                        };
                        resolve({
                            session: session,
                            operator: {
                                accountId: this.authWeb3Options.operator.accountId,
                                publicKey: this.authWeb3Options.operator.publicKey.toString()
                            },
                            accessToken: this.jwtService.sign(session)
                        });
                    }
                    catch (error) {
                        resolve(null);
                    }
                }
                else {
                    resolve(null);
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
    fetchTokenGateInfos(wallet) {
        return new Promise(async (resolve, reject) => {
            try {
                let nftsBalance = null;
                if (this.authWeb3Options.tokenGateOptions.enabled) {
                    let nfts = this.authWeb3Options.tokenGateOptions
                        .roles.filter(role => role.tokenId != null)
                        .map(role => role.tokenId);
                    let nftBalancePromises = nfts.map(nft => this.httpService.axiosRef.get(`accounts/${wallet}/nfts`, {
                        params: {
                            'token.id': nft
                        }
                    }));
                    let nftBalanceResponses = await Promise.all(nftBalancePromises);
                    nftsBalance = nftBalanceResponses.map(nft => nft.data.nfts).flat();
                    let nftMetadatasPromises = nftsBalance.map(nft => this.ipfsResolverService.getMetadata(nft.metadata));
                    let nftMetadatas = await Promise.all(nftMetadatasPromises);
                    nftsBalance.forEach((nft, index) => {
                        nft.metadata = nftMetadatas[index];
                        nft.role = this.authWeb3Options.tokenGateOptions.roles.find(role => role.tokenId == nft.token_id)?.role;
                    });
                }
                resolve(nftsBalance);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async login(user, payload) {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(user);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async validateSignature(signedData, operator) {
        return new Promise(async (resolve, reject) => {
            try {
                let originalUserSignedPayload = lodash.cloneDeep(signedData.signedPayload);
                if (lodash.isString(signedData.signedPayload)) {
                    signedData.signedPayload = JSON.parse(signedData.signedPayload.replace(/^[^{]+|[^}]+$/g, ''));
                }
                let serverSignature = Object.entries(signedData.signedPayload.serverSignature).map(([key, value]) => value);
                signedData.signedPayload.serverSignature = new Uint8Array(serverSignature);
                let serverKeyVerified = this.verifyData(signedData.signedPayload.originalPayload, this.authWeb3Options.operator.publicKey, new Uint8Array(serverSignature));
                let userSignature = null;
                if (signedData.userSignature.type == 'Buffer') {
                    userSignature = signedData.userSignature.data;
                }
                else {
                    userSignature = Object.entries(signedData.userSignature).map(([key, value]) => value);
                }
                let userKeyVerified = this.verifyData(originalUserSignedPayload, operator.publicKey, new Uint8Array(userSignature));
                resolve(serverKeyVerified && userKeyVerified);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    signData(data) {
        const privateKey = sdk_1.PrivateKey.fromString(this.authWeb3Options.operator.privateKey);
        let bytes = new Uint8Array(Buffer.from(JSON.stringify(data)));
        let signature = privateKey.sign(bytes);
        return {
            signature: signature,
            serverSigningAccount: this.authWeb3Options.operator.accountId
        };
    }
    verifyData(data, publicKey, signature) {
        const pubKey = sdk_1.PublicKey.fromString(publicKey);
        let originalData = lodash.clone(data);
        if (lodash.isString(data)) {
            data = JSON.parse(data.replace(/^[^{]+|[^}]+$/g, ''));
        }
        if (data.serverSignature) {
            data.serverSignature = new Uint8Array(data.serverSignature);
        }
        let bytes = new Uint8Array(Buffer.from(lodash.isString(originalData) ? originalData : JSON.stringify(originalData)));
        let verify = pubKey.verify(bytes, signature);
        return verify;
    }
};
exports.AuthWeb3Service = AuthWeb3Service;
exports.AuthWeb3Service = AuthWeb3Service = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('authWeb3Options')),
    __param(1, (0, common_1.Inject)('JwtAuthService')),
    __metadata("design:paramtypes", [Object, Object, config_1.ConfigService,
        axios_1.HttpService,
        ipfs_resolver_1.IpfsResolverService])
], AuthWeb3Service);
//# sourceMappingURL=web3.service.js.map