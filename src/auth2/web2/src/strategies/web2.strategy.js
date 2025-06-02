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
exports.Web2Strategy = void 0;
const passport_1 = require("@nestjs/passport");
const passport_custom_1 = require("passport-custom");
const web2_service_1 = require("../auth/web2.service");
const common_1 = require("@nestjs/common");
const types_1 = require("@hsuite/types");
let Web2Strategy = class Web2Strategy extends (0, passport_1.PassportStrategy)(passport_custom_1.Strategy, 'web2') {
    constructor(authWeb2Options, web2Service) {
        super();
        this.authWeb2Options = authWeb2Options;
        this.web2Service = web2Service;
    }
    async validate(request) {
        let payload = request.body;
        const user = await this.web2Service.validateUser(payload);
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        return user;
    }
};
exports.Web2Strategy = Web2Strategy;
exports.Web2Strategy = Web2Strategy = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('authWeb2Options')),
    __metadata("design:paramtypes", [Object, web2_service_1.AuthWeb2Service])
], Web2Strategy);
//# sourceMappingURL=web2.strategy.js.map