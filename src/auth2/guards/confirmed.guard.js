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
exports.ConfirmedAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const types_1 = require("@hsuite/types");
const decorators_1 = require("@hsuite/decorators");
const users_1 = require("@hsuite/users");
let ConfirmedAuthGuard = class ConfirmedAuthGuard {
    constructor(reflector, usersService, authOptions) {
        this.reflector = reflector;
        this.usersService = usersService;
        this.authOptions = authOptions;
    }
    async canActivate(context) {
        if (this.authOptions.confirmation_required) {
            const isPublic = this.reflector.getAllAndOverride(decorators_1.IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
            if (isPublic) {
                return true;
            }
            if (context.getHandler().name == 'login'
                || context.getHandler().name == 'logout'
                || context.getHandler().name == 'profile') {
                return true;
            }
            const request = context.switchToHttp().getRequest();
            if (!request.user) {
                throw new common_1.UnauthorizedException('Unauthorized.');
            }
            let userDocument = await this.usersService.findById(request.user._id);
            if (!userDocument) {
                throw new common_1.UnauthorizedException('Unauthorized.');
            }
            if (userDocument && !userDocument.confirmed) {
                throw new common_1.UnauthorizedException('Please confirm your email address.');
            }
            return true;
        }
    }
};
exports.ConfirmedAuthGuard = ConfirmedAuthGuard;
exports.ConfirmedAuthGuard = ConfirmedAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)('authOptions')),
    __metadata("design:paramtypes", [core_1.Reflector,
        users_1.UsersService, Object])
], ConfirmedAuthGuard);
//# sourceMappingURL=confirmed.guard.js.map