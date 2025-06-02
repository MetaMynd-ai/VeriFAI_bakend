"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TwoFactoryAuthModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactoryAuthModule = void 0;
const common_1 = require("@nestjs/common");
const _2fa_service_1 = require("./2fa.service");
const _2fa_controller_1 = require("./2fa.controller");
const users_1 = require("@hsuite/users");
let TwoFactoryAuthModule = TwoFactoryAuthModule_1 = class TwoFactoryAuthModule {
    static forRoot(options) {
        return {
            module: TwoFactoryAuthModule_1,
            imports: [
                users_1.UsersModule
            ],
            controllers: [
                _2fa_controller_1.TwoFactoryAuthController
            ],
            providers: [
                {
                    provide: 'twilioOptions',
                    useValue: options
                },
                _2fa_service_1.TwoFactoryAuthService
            ],
            exports: [
                _2fa_service_1.TwoFactoryAuthService
            ]
        };
    }
};
exports.TwoFactoryAuthModule = TwoFactoryAuthModule;
exports.TwoFactoryAuthModule = TwoFactoryAuthModule = TwoFactoryAuthModule_1 = __decorate([
    (0, common_1.Module)({})
], TwoFactoryAuthModule);
//# sourceMappingURL=2fa.module.js.map