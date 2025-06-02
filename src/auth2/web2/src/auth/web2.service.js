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
var AuthWeb2Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthWeb2Service = void 0;
const types_1 = require("@hsuite/types");
const users_1 = require("@hsuite/users");
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
const bcrypt = require("bcrypt");
const moment = require("moment");
const lodash = require("lodash");
let AuthWeb2Service = AuthWeb2Service_1 = class AuthWeb2Service {
    constructor(authWeb2Options, jwtService, usersService, mailerService) {
        this.authWeb2Options = authWeb2Options;
        this.jwtService = jwtService;
        this.usersService = usersService;
        this.mailerService = mailerService;
        this.logger = new common_1.Logger(AuthWeb2Service_1.name);
    }
    async validateUser(user) {
        return new Promise(async (resolve, reject) => {
            try {
                const userDocument = await this.usersService.find(user);
                if (userDocument &&
                    (await bcrypt.compare(user.password, userDocument.password))) {
                    const { password, ...result } = userDocument;
                    resolve(result);
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
    async sendConfirmationEmail(userId, userEmail) {
        return new Promise(async (resolve, reject) => {
            try {
                let accessToken = this.jwtService.sign({
                    userId: userId,
                    type: 'email_confirmation'
                });
                let sendMailOptions = lodash.cloneDeep(this.authWeb2Options.sendMailOptions);
                sendMailOptions.confirm.to = userEmail;
                sendMailOptions.confirm.text =
                    this.authWeb2Options.sendMailOptions.confirm.text.replace('PLACE_HOLDER_FOR_TOKEN', accessToken);
                sendMailOptions.confirm.html =
                    this.authWeb2Options.sendMailOptions.confirm.html.replace('PLACE_HOLDER_FOR_TOKEN', accessToken);
                await this.mailerService.sendMail(sendMailOptions.confirm);
                resolve(true);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async create(user) {
        return new Promise(async (resolve, reject) => {
            try {
                const web2User = await this.usersService.create({
                    ...user,
                    created_at: moment().unix(),
                    updated_at: moment().unix(),
                    confirmed: false,
                    type: types_1.IAuth.ICredentials.IUser.IType.WEB2,
                    role: 'user',
                    banned: false,
                    twoFactorAuth: {
                        status: types_1.IAuth.ITwoFactor.IStatus.disabled,
                        factorSid: '',
                        identity: '',
                        qr_code: ''
                    },
                });
                if (this.authWeb2Options.confirmation_required) {
                    try {
                        await this.sendConfirmationEmail(web2User._id, user.email);
                    }
                    catch (error) {
                        this.logger.error(error.message);
                    }
                }
                const { password, ...newUser } = web2User;
                resolve(newUser);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async passwordRecoveryRequest(email) {
        return new Promise(async (resolve, reject) => {
            try {
                let userDocument = await this.usersService.find({
                    email: email,
                    username: null,
                    password: null
                });
                if (!userDocument) {
                    throw new Error('User not found');
                }
                let accessToken = this.jwtService.sign({
                    userId: userDocument._id,
                    type: 'password_recovery'
                });
                let sendMailOptions = lodash.cloneDeep(this.authWeb2Options.sendMailOptions);
                sendMailOptions.reset.to = email;
                sendMailOptions.reset.text =
                    this.authWeb2Options.sendMailOptions.reset.text.replace('PLACE_HOLDER_FOR_TOKEN', accessToken);
                sendMailOptions.reset.html =
                    this.authWeb2Options.sendMailOptions.reset.html.replace('PLACE_HOLDER_FOR_TOKEN', accessToken);
                await this.mailerService.sendMail(sendMailOptions.reset);
                resolve(true);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async passwordRecoveryReset(token, newPassword) {
        return new Promise(async (resolve, reject) => {
            try {
                let payload = this.jwtService.verify(token);
                let userDocument = await this.usersService.findById(payload.userId);
                if (!userDocument) {
                    throw new Error('User not found');
                }
                if (payload.type != 'password_recovery') {
                    throw new common_1.UnauthorizedException('Invalid token');
                }
                await this.usersService.updatePassword(userDocument.email, newPassword);
                resolve(true);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async emailConfirmation(token) {
        return new Promise(async (resolve, reject) => {
            try {
                let payload = this.jwtService.verify(token);
                let userDocument = await this.usersService.findById(payload.userId);
                if (!userDocument) {
                    throw new Error('User not found');
                }
                if (payload.type != 'email_confirmation') {
                    throw new Error('Invalid token');
                }
                await this.usersService.emailConfirmation(payload.userId);
                resolve(true);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async login(user) {
        const smartNodeUser = await this.usersService.find(user);
        const { password, ...userSafe } = smartNodeUser;
        return {
            user: userSafe,
            operator: {
                accountId: this.authWeb2Options.operator.accountId,
                publicKey: this.authWeb2Options.operator.publicKey.toString(),
                url: this.authWeb2Options.operator.url
            },
            accessToken: this.jwtService.sign(userSafe)
        };
    }
};
exports.AuthWeb2Service = AuthWeb2Service;
exports.AuthWeb2Service = AuthWeb2Service = AuthWeb2Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('authWeb2Options')),
    __param(1, (0, common_1.Inject)('JwtAuthService')),
    __metadata("design:paramtypes", [Object, Object, users_1.UsersService,
        mailer_1.MailerService])
], AuthWeb2Service);
//# sourceMappingURL=web2.service.js.map