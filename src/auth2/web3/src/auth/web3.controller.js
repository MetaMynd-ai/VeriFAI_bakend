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
exports.AuthWeb3Controller = void 0;
const common_1 = require("@nestjs/common");
const web3_service_1 = require("./web3.service");
const swagger_1 = require("@nestjs/swagger");
const types_1 = require("@hsuite/types");
const moment = require("moment");
const web3_guard_1 = require("../guards/web3.guard");
const decorators_1 = require("@hsuite/decorators");
let AuthWeb3Controller = class AuthWeb3Controller {
    constructor(authWeb3Options, web3Service) {
        this.authWeb3Options = authWeb3Options;
        this.web3Service = web3Service;
    }
    async request(request) {
        try {
            let payload = {
                url: 'https://hbarsuite.app',
                node: this.web3Service.getOperatorId(),
                data: {
                    token: this.web3Service.generateToken()
                }
            };
            let signedData = this.web3Service.signData(payload);
            let authenticateRequest = {
                signedData: signedData,
                payload: payload
            };
            return authenticateRequest;
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async login(credentials, response, request) {
        try {
            let authLogin = await this.web3Service.login(request.user, credentials);
            if (this.authWeb3Options.passport == types_1.IAuth.IConfiguration.IPassportStrategy.JWT) {
                response.cookie('accessToken', authLogin.accessToken, {
                    expires: moment().add(this.authWeb3Options.jwt.signOptions.expiresIn, 'hour').toDate()
                });
            }
            return authLogin;
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async logout(request, response) {
        try {
            if (this.authWeb3Options.passport == types_1.IAuth.IConfiguration.IPassportStrategy.JWT) {
                response.cookie('accessToken', null, {
                    expires: moment().toDate()
                });
            }
            else {
                request.session.destroy();
                response.cookie('connect.sid', null, {
                    expires: moment().toDate()
                });
            }
            return {
                logout: true,
                message: 'The user session has ended'
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.AuthWeb3Controller = AuthWeb3Controller;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('request'),
    (0, swagger_1.ApiOperation)({
        summary: 'trigger a request to be signed offline with your web3 wallet.',
        description: 'This endpoint will return a payload to be signed offline with your web3 wallet. \
    The signed payload will then be sent to the login endpoint to authenticate the user.'
    }),
    (0, swagger_1.ApiOkResponse)({
        type: types_1.Auth.Credentials.Web3.Request.Authentication.Authenticate,
        status: 200,
        description: "Returns a Web3AuthRequestDto."
    }),
    (0, swagger_1.ApiNotFoundResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthWeb3Controller.prototype, "request", null);
__decorate([
    (0, common_1.UseGuards)(web3_guard_1.Web3AuthGuard),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({
        summary: 'create a user session from a web3 signed payload.',
        description: 'This endpoint will create a user session from a web3 signed payload. \
    The payload must be signed offline with your web3 wallet.'
    }),
    (0, swagger_1.ApiBody)({
        type: types_1.Auth.Credentials.Web3.Request.Signin.Login,
        description: "The signed payload from the request endpoint."
    }),
    (0, swagger_1.ApiOkResponse)({
        type: types_1.Auth.Credentials.Web3.Request.Signin.Login,
        status: 200,
        description: "Returns a Auth.Credentials.Web3.Request.Signin.Login."
    }),
    (0, swagger_1.ApiNotFoundResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [types_1.Auth.Credentials.Web3.Request.Signin.Login, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthWeb3Controller.prototype, "login", null);
__decorate([
    (0, common_1.Get)('/logout'),
    (0, swagger_1.ApiOperation)({
        summary: 'allow a user to logout and destroy the session.',
        description: 'This endpoint will destroy the session and the user will be logged out. \
    This endpoint is protected and requires authentication.'
    }),
    (0, swagger_1.ApiOkResponse)({
        type: types_1.Auth.Credentials.Web3.Response.Logout,
        status: 200,
        description: "Returns a CredentialsLogoutResponse."
    }),
    (0, swagger_1.ApiNotFoundResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthWeb3Controller.prototype, "logout", null);
exports.AuthWeb3Controller = AuthWeb3Controller = __decorate([
    (0, common_1.Controller)('auth/web3'),
    (0, swagger_1.ApiTags)('auth/web3'),
    __param(0, (0, common_1.Inject)('authWeb3Options')),
    __metadata("design:paramtypes", [Object, web3_service_1.AuthWeb3Service])
], AuthWeb3Controller);
//# sourceMappingURL=web3.controller.js.map