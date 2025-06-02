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
exports.AuthWeb2AccountsController = void 0;
const common_1 = require("@nestjs/common");
const web2_service_1 = require("./web2.service");
const users_1 = require("@hsuite/users");
const swagger_1 = require("@nestjs/swagger");
const types_1 = require("@hsuite/types");
const decorators_1 = require("@hsuite/decorators");
let AuthWeb2AccountsController = class AuthWeb2AccountsController {
    constructor(authWeb2Options, web2Service) {
        this.authWeb2Options = authWeb2Options;
        this.web2Service = web2Service;
    }
    async register(request, credentials) {
        try {
            if (!request.user) {
                return await this.web2Service.create(credentials);
            }
            else {
                throw new common_1.BadRequestException('you are currently logged in. Please logout to create a new account.');
            }
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async passwordRecoveryRequest(email) {
        try {
            return await this.web2Service.passwordRecoveryRequest(email);
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async passwordRecoveryReset(token, newPassword) {
        try {
            return await this.web2Service.passwordRecoveryReset(token, newPassword);
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async emailConfirmation(token) {
        try {
            return await this.web2Service.emailConfirmation(token);
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async emailConfirmationRequest(request) {
        try {
            if (!request.user.confirmed) {
                return await this.web2Service.sendConfirmationEmail(request.user._id, request.user.email);
            }
            else {
                throw new Error('The email is already confirmed');
            }
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.AuthWeb2AccountsController = AuthWeb2AccountsController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({
        summary: 'register a new user with email and password.',
        description: 'This endpoint is always open and does not require authentication. \
    It is used to create a new user in the database. \
    The user will be able to login with the credentials provided.'
    }),
    (0, swagger_1.ApiBody)({
        type: types_1.Auth.Credentials.Web2.Dto.Signup,
        required: true
    }),
    (0, swagger_1.ApiOkResponse)({
        type: users_1.UserSafe,
        status: 200,
        description: "Returns a UserSafe."
    }),
    (0, swagger_1.ApiNotFoundResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, types_1.Auth.Credentials.Web2.Dto.Signup]),
    __metadata("design:returntype", Promise)
], AuthWeb2AccountsController.prototype, "register", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('password/recovery/request'),
    (0, swagger_1.ApiOperation)({
        summary: 'send a password reset email to the user.',
        description: 'This endpoint is always open and does not require authentication. \
    It will send a password reset email to the user if the user exists in the database.'
    }),
    (0, swagger_1.ApiOkResponse)({
        type: Boolean,
        status: 200,
        description: "Returns a Boolean."
    }),
    (0, swagger_1.ApiNotFoundResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    (0, swagger_1.ApiQuery)({
        name: 'email',
        required: false,
        description: 'The email of the user to send the password reset email to.'
    }),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthWeb2AccountsController.prototype, "passwordRecoveryRequest", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('password/recovery/reset'),
    (0, swagger_1.ApiOperation)({
        summary: 'reset the password of the user.',
        description: 'This endpoint is always open and does not require authentication. \
    It will allow the user to reset the password if the user exists and the token is valid.'
    }),
    (0, swagger_1.ApiOkResponse)({
        type: Boolean,
        status: 200,
        description: "Returns a Boolean."
    }),
    (0, swagger_1.ApiNotFoundResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    (0, swagger_1.ApiQuery)({
        name: 'token',
        required: false,
        description: 'The token of the user to reset the password of, received in the email.'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'newPassword',
        required: false,
        description: 'The new password of the user.'
    }),
    __param(0, (0, common_1.Query)('token')),
    __param(1, (0, common_1.Query)('newPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthWeb2AccountsController.prototype, "passwordRecoveryReset", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('email/confirm'),
    (0, swagger_1.ApiOperation)({
        summary: 'confirm the email of the user.',
        description: 'This endpoint is private and does require authentication. \
    It will allow the user to confirm the email with the received token.'
    }),
    (0, swagger_1.ApiOkResponse)({
        type: Boolean,
        status: 200,
        description: "Returns a Boolean."
    }),
    (0, swagger_1.ApiNotFoundResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    (0, swagger_1.ApiQuery)({
        name: 'token',
        required: false,
        description: 'The token to confirm the email, received in the email.'
    }),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthWeb2AccountsController.prototype, "emailConfirmation", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('email/confirm/request'),
    (0, swagger_1.ApiOperation)({
        summary: 'confirm the email of the user.',
        description: 'This endpoint is always open and does not require authentication. \
    It will allow the user to confirm the email if the user exists and the token is valid.'
    }),
    (0, swagger_1.ApiOkResponse)({
        type: Boolean,
        status: 200,
        description: "Returns a Boolean."
    }),
    (0, swagger_1.ApiNotFoundResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthWeb2AccountsController.prototype, "emailConfirmationRequest", null);
exports.AuthWeb2AccountsController = AuthWeb2AccountsController = __decorate([
    (0, common_1.Controller)('auth/web2'),
    (0, swagger_1.ApiTags)('auth/web2'),
    __param(0, (0, common_1.Inject)('authWeb2Options')),
    __metadata("design:paramtypes", [Object, web2_service_1.AuthWeb2Service])
], AuthWeb2AccountsController);
//# sourceMappingURL=web2.accounts.controller.js.map