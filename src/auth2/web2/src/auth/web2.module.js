"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthWeb2Module_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthWeb2Module = void 0;
const common_1 = require("@nestjs/common");
const web2_service_1 = require("./web2.service");
const users_1 = require("@hsuite/users");
const web2_strategy_1 = require("../strategies/web2.strategy");
const web2_sessions_controller_1 = require("./web2.sessions.controller");
const web2_accounts_controller_1 = require("./web2.accounts.controller");
const mailer_1 = require("@nestjs-modules/mailer");
const _2fa_module_1 = require("../../2fa/2fa.module");
const core_1 = require("@nestjs/core");
const auth_guard_1 = require("../../2fa/auth/auth.guard");
const admin_guard_1 = require("../guards/admin.guard");
let AuthWeb2Module = AuthWeb2Module_1 = class AuthWeb2Module {
    static async forRootAsync(options) {
        let factory = await options.useFactory();
        return {
            module: AuthWeb2Module_1,
            imports: [
                users_1.UsersModule,
                mailer_1.MailerModule.forRoot(factory.mailerOptions),
                ...(factory.twilioOptions.enabled ?
                    [
                        _2fa_module_1.TwoFactoryAuthModule.forRoot(factory.twilioOptions)
                    ] : [])
            ],
            controllers: [
                ...(factory.admin_only ?
                    [
                        web2_sessions_controller_1.AuthWeb2SessionController
                    ] : [
                    web2_sessions_controller_1.AuthWeb2SessionController,
                    web2_accounts_controller_1.AuthWeb2AccountsController
                ]),
            ],
            providers: [
                {
                    provide: 'authWeb2Options',
                    useFactory: options.useFactory
                },
                ...(factory.twilioOptions.enabled ?
                    [
                        {
                            provide: core_1.APP_GUARD,
                            useClass: auth_guard_1.TwoFactoryAuthGuard,
                        }
                    ] : []),
                ...(factory.admin_only ?
                    [
                        {
                            provide: core_1.APP_GUARD,
                            useClass: admin_guard_1.AdminAuthGuard,
                        }
                    ] : []),
                web2_service_1.AuthWeb2Service,
                web2_strategy_1.Web2Strategy
            ],
            exports: [
                web2_service_1.AuthWeb2Service,
                web2_strategy_1.Web2Strategy
            ]
        };
    }
};
exports.AuthWeb2Module = AuthWeb2Module;
exports.AuthWeb2Module = AuthWeb2Module = AuthWeb2Module_1 = __decorate([
    (0, common_1.Module)({})
], AuthWeb2Module);
//# sourceMappingURL=web2.module.js.map