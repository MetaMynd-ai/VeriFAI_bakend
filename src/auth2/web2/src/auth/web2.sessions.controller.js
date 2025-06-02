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
exports.AuthWeb2SessionController = void 0;
const common_1 = require("@nestjs/common");
const web2_service_1 = require("./web2.service");
const types_1 = require("@hsuite/types");
const moment = require("moment");
const swagger_1 = require("@nestjs/swagger");
const types_2 = require("@hsuite/types");
const web2_guard_1 = require("../guards/web2.guard");
let AuthWeb2SessionController = class AuthWeb2SessionController {
    constructor(authWeb2Options, web2Service) {
        this.authWeb2Options = authWeb2Options;
        this.web2Service = web2Service;
    }
    async login(credentials, response) {
        try {
            let authLogin = await this.web2Service.login(credentials);
            if (this.authWeb2Options.passport == types_2.IAuth.IConfiguration.IPassportStrategy.JWT) {
                response.cookie('accessToken', authLogin.accessToken, {
                    expires: moment().add(this.authWeb2Options.jwt.signOptions.expiresIn, 'hour').toDate()
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
            if (this.authWeb2Options.passport == types_2.IAuth.IConfiguration.IPassportStrategy.JWT) {
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
exports.AuthWeb2SessionController = AuthWeb2SessionController;
__decorate([
    (0, common_1.UseGuards)(web2_guard_1.Web2AuthGuard),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({
        summary: 'allow a user to login with email/username and password.',
        description: 'This endpoint is always open and does not require authentication. \
    it will though check the existence of the user in the database and the validity of the credentials. \
    If the user exists and the credentials are valid, a session will be created.'
    }),
    (0, swagger_1.ApiOkResponse)({
        type: types_1.Auth.Credentials.Web2.Response.Login,
        status: 200,
        description: "Returns a Auth.Credentials.Web2.Response.Login."
    }),
    (0, swagger_1.ApiBody)({
        type: types_1.Auth.Credentials.Web2.Dto.SessionLogin,
        required: true
    }),
    (0, swagger_1.ApiNotFoundResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [types_1.Auth.Credentials.Web2.Dto.SessionLogin, Object]),
    __metadata("design:returntype", Promise)
], AuthWeb2SessionController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('/logout'),
    (0, swagger_1.ApiOperation)({
        summary: 'allow a user to logout and destroy the session.',
        description: 'This endpoint is protected and requires authentication. \
    It will destroy the session and the user will be logged out.'
    }),
    (0, swagger_1.ApiOkResponse)({
        type: types_1.Auth.Credentials.Web2.Response.Logout,
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
], AuthWeb2SessionController.prototype, "logout", null);
exports.AuthWeb2SessionController = AuthWeb2SessionController = __decorate([
    (0, common_1.Controller)('auth/web2'),
    (0, swagger_1.ApiTags)('auth/web2'),
    __param(0, (0, common_1.Inject)('authWeb2Options')),
    __metadata("design:paramtypes", [Object, web2_service_1.AuthWeb2Service])
], AuthWeb2SessionController);
//# sourceMappingURL=web2.sessions.controller.js.map