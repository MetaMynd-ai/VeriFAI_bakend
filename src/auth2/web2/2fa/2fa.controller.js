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
exports.TwoFactoryAuthController = void 0;
const common_1 = require("@nestjs/common");
const _2fa_service_1 = require("./2fa.service");
const swagger_1 = require("@nestjs/swagger");
const types_1 = require("@hsuite/types");
let TwoFactoryAuthController = class TwoFactoryAuthController {
    constructor(twoFactoryAuthService) {
        this.twoFactoryAuthService = twoFactoryAuthService;
    }
    async verifyFactor(request) {
        try {
            return await this.twoFactoryAuthService.createFactor(request.user._id);
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async deleteFactor(code, request) {
        try {
            return await this.twoFactoryAuthService.deleteFactor(code, request.user._id);
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async createFactor(code, request) {
        try {
            return await this.twoFactoryAuthService.verifyFactor(request.user._id, code);
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async createChallenge(code, request) {
        try {
            return await this.twoFactoryAuthService.createChallenge(request.user._id, code);
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.TwoFactoryAuthController = TwoFactoryAuthController;
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'create a new factor for the logged in user.',
        description: 'This endpoint is only available if the user is authenticated. \
    It will return a new factor for the user.'
    }),
    (0, swagger_1.ApiOkResponse)({
        type: types_1.Auth.TwoFactor.Response.Create,
        status: 200,
        description: "Returns a Auth.Twilio.TwoFactorCreateResponse."
    }),
    (0, swagger_1.ApiNotFoundResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    (0, common_1.Post)('factor/create'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TwoFactoryAuthController.prototype, "verifyFactor", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'delete the factor for the logged in user.',
        description: 'This endpoint is only available if the user is authenticated. \
    It will allow the logged in user to delete the factor.'
    }),
    (0, swagger_1.ApiOkResponse)({
        type: types_1.Auth.TwoFactor.Response.Delete,
        status: 200,
        description: "Returns a Auth.Twilio.TwoFactorDeleteResponse."
    }),
    (0, swagger_1.ApiNotFoundResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    (0, common_1.Post)('factor/delete'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TwoFactoryAuthController.prototype, "deleteFactor", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'verify a new factor for the logged in user.',
        description: 'This endpoint is only available if the user is authenticated. \
    It will allow the logged in user to verify a new factor.'
    }),
    (0, swagger_1.ApiOkResponse)({
        type: types_1.Auth.TwoFactor.Response.Verify,
        status: 200,
        description: "Returns a Auth.Twilio.TwoFactorVerifyResponse."
    }),
    (0, swagger_1.ApiNotFoundResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    (0, common_1.Post)('factor/verify'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TwoFactoryAuthController.prototype, "createFactor", null);
__decorate([
    (0, swagger_1.ApiExcludeEndpoint)(),
    (0, swagger_1.ApiOperation)({
        summary: 'verify a new factor for the logged in user.',
        description: 'This endpoint is only available if the user is authenticated. \
    It will allow the logged in user to verify a new factor.'
    }),
    (0, swagger_1.ApiOkResponse)({
        type: types_1.Auth.TwoFactor.Response.Verify,
        status: 200,
        description: "Returns a Auth.Twilio.TwoFactorVerifyResponse."
    }),
    (0, swagger_1.ApiNotFoundResponse)(),
    (0, swagger_1.ApiBadRequestResponse)(),
    (0, common_1.Get)('challenge/verify'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TwoFactoryAuthController.prototype, "createChallenge", null);
exports.TwoFactoryAuthController = TwoFactoryAuthController = __decorate([
    (0, common_1.Controller)('auth/2fa'),
    (0, swagger_1.ApiTags)('auth/2fa'),
    __metadata("design:paramtypes", [_2fa_service_1.TwoFactoryAuthService])
], TwoFactoryAuthController);
//# sourceMappingURL=2fa.controller.js.map