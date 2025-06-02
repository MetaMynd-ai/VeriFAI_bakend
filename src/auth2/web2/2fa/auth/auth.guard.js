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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactoryAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const _2fa_service_1 = require("../2fa.service");
const core_1 = require("@nestjs/core");
const decorators_1 = require("@hsuite/decorators");
let TwoFactoryAuthGuard = class TwoFactoryAuthGuard {
    constructor(twoFactoryAuthService, reflector) {
        this.twoFactoryAuthService = twoFactoryAuthService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const isTwoFactorAuth = this.reflector.getAllAndOverride(decorators_1.IS_TWO_FACTOR_AUTH, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!isTwoFactorAuth) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        if (!request.body.code_2fa) {
            throw new common_1.UnauthorizedException('2FA code is required.');
        }
        try {
            let isEnabled = await this.twoFactoryAuthService.isEnabled(request.user._id);
            if (!isEnabled) {
                throw new common_1.UnauthorizedException('2FA is not enabled.');
            }
            await this.twoFactoryAuthService.createChallenge(request.user._id, request.body.code_2fa);
        }
        catch (error) {
            throw new common_1.UnauthorizedException(error.message);
        }
        return true;
    }
};
exports.TwoFactoryAuthGuard = TwoFactoryAuthGuard;
exports.TwoFactoryAuthGuard = TwoFactoryAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [_2fa_service_1.TwoFactoryAuthService,
        core_1.Reflector])
], TwoFactoryAuthGuard);
//# sourceMappingURL=auth.guard.js.map