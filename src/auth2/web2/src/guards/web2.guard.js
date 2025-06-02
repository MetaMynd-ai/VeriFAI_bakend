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
exports.Web2AuthGuard = void 0;
const types_1 = require("@hsuite/types");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const passport_1 = require("@nestjs/passport");
const decorators_1 = require("@hsuite/decorators");
let Web2AuthGuard = class Web2AuthGuard extends (0, passport_1.AuthGuard)('web2') {
    constructor(authWeb2Options, reflector) {
        super();
        this.authWeb2Options = authWeb2Options;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(decorators_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        if (this.authWeb2Options.passport == types_1.IAuth.IConfiguration.IPassportStrategy.REDIS) {
            const result = (await super.canActivate(context));
            const request = context.switchToHttp().getRequest();
            await super.logIn(request);
            return result;
        }
        else {
            return super.canActivate(context);
        }
    }
    handleRequest(err, user, info) {
        if (err || !user) {
            throw err || new common_1.UnauthorizedException();
        }
        return user;
    }
};
exports.Web2AuthGuard = Web2AuthGuard;
exports.Web2AuthGuard = Web2AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('authWeb2Options')),
    __metadata("design:paramtypes", [Object, core_1.Reflector])
], Web2AuthGuard);
//# sourceMappingURL=web2.guard.js.map