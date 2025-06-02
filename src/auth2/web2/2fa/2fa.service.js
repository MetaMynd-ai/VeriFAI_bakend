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
exports.TwoFactoryAuthService = void 0;
const common_1 = require("@nestjs/common");
const users_1 = require("@hsuite/users");
const { v4: uuidv4 } = require('uuid');
const types_1 = require("@hsuite/types");
let TwoFactoryAuthService = class TwoFactoryAuthService {
    constructor(usersService, twilioOptions) {
        this.usersService = usersService;
        this.twilioOptions = twilioOptions;
        this.client = require('twilio')(this.twilioOptions.twilioSecrets.accountSid, this.twilioOptions.twilioSecrets.authToken);
    }
    async isEnabled(userId) {
        return new Promise(async (resolve, reject) => {
            try {
                let userDocument = await this.usersService.findById(userId);
                if (!userDocument) {
                    reject(new Error('User not found'));
                }
                if (userDocument.twoFactorAuth.status === 'verified') {
                    resolve(true);
                }
                resolve(false);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async createFactor(userId) {
        return new Promise(async (resolve, reject) => {
            try {
                let userDocument = await this.usersService.findById(userId);
                if (!userDocument) {
                    reject(new Error('User not found'));
                }
                if (userDocument.twoFactorAuth.status === 'verified') {
                    reject(new Error('2FA already enabled.'));
                }
                if (userDocument.twoFactorAuth.status === 'unverified') {
                    reject(new Error('2FA already enabled, but not verified.'));
                }
                let identity = uuidv4();
                let factor = await this.client.verify.v2
                    .services(this.twilioOptions.twilioSecrets.serviceSid)
                    .entities(identity)
                    .newFactors
                    .create({
                    friendlyName: userDocument.email,
                    factorType: 'totp'
                });
                let twoFactorAuth = {
                    status: types_1.IAuth.ITwoFactor.IStatus.unverified,
                    identity: identity,
                    factorSid: factor.sid,
                    qr_code: factor.binding.uri
                };
                await this.usersService.updateTwoFactorAuth(userId, twoFactorAuth);
                let response = {
                    factorSid: factor.sid,
                    identity,
                    uri: factor.binding.uri,
                    secret: factor.binding.secret,
                    message: `Please scan the QR code in an authenticator app like Authy.`,
                };
                resolve(response);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async deleteFactor(code, userId) {
        return new Promise(async (resolve, reject) => {
            try {
                let userDocument = await this.usersService.findById(userId);
                if (!userDocument) {
                    reject(new Error('User not found'));
                }
                if (userDocument.twoFactorAuth.status === 'disabled') {
                    reject(new Error('2FA already disabled.'));
                }
                try {
                    await this.createChallenge(userId, code);
                }
                catch (error) {
                    reject(error);
                }
                await this.client.verify.v2
                    .services(this.twilioOptions.twilioSecrets.serviceSid)
                    .entities(userDocument.twoFactorAuth.identity)
                    .factors(userDocument.twoFactorAuth.factorSid)
                    .remove();
                let twoFactorAuth = {
                    status: types_1.IAuth.ITwoFactor.IStatus.disabled,
                    identity: '',
                    factorSid: '',
                    qr_code: ''
                };
                await this.usersService.updateTwoFactorAuth(userId, twoFactorAuth);
                let response = {
                    success: true,
                    message: `Your 2FA has been disabled.`,
                };
                resolve(response);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async verifyFactor(userId, code) {
        return new Promise(async (resolve, reject) => {
            try {
                let userDocument = await this.usersService.findById(userId);
                if (!userDocument) {
                    reject(new Error('User not found'));
                }
                let checkedFactor = await this.client.verify.v2
                    .services(this.twilioOptions.twilioSecrets.serviceSid)
                    .entities(userDocument.twoFactorAuth.identity)
                    .factors(userDocument.twoFactorAuth.factorSid)
                    .update({ authPayload: code });
                if (checkedFactor.status !== types_1.IAuth.ITwoFactor.IStatus.verified) {
                    throw new Error('Incorrect code.');
                }
                userDocument.twoFactorAuth.status = types_1.IAuth.ITwoFactor.IStatus.verified;
                await this.usersService.updateTwoFactorAuth(userId, userDocument.twoFactorAuth);
                resolve({
                    success: true,
                    message: 'Factor verified.',
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async createChallenge(userId, code) {
        return new Promise(async (resolve, reject) => {
            try {
                let userDocument = await this.usersService.findById(userId);
                if (!userDocument) {
                    reject(new Error('User not found'));
                }
                let challenge = await this.client.verify.v2
                    .services(this.twilioOptions.twilioSecrets.serviceSid)
                    .entities(userDocument.twoFactorAuth.identity)
                    .challenges
                    .create({
                    authPayload: code,
                    factorSid: userDocument.twoFactorAuth.factorSid
                });
                if (challenge.status !== 'approved') {
                    throw new Error('Incorrect code.');
                }
                resolve({
                    success: true,
                    message: 'Verification success.',
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
};
exports.TwoFactoryAuthService = TwoFactoryAuthService;
exports.TwoFactoryAuthService = TwoFactoryAuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('twilioOptions')),
    __metadata("design:paramtypes", [users_1.UsersService, Object])
], TwoFactoryAuthService);
//# sourceMappingURL=2fa.service.js.map