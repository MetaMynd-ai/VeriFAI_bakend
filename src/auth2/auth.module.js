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
var AuthModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const session_serializer_1 = require("./serializers/session.serializer");
const redis_module_1 = require("./redis/redis.module");
const redis_constants_1 = require("./redis/redis.constants");
const session = require("express-session");
const passport = require("passport");
const src_1 = require("./web2/src");
const src_2 = require("./web3/src");
const core_1 = require("@nestjs/core");
const redis_guard_1 = require("./guards/redis.guard");
const jwt_guard_1 = require("./guards/jwt.guard");
const types_1 = require("@hsuite/types");
const auth_controller_1 = require("./auth.controller");
const confirmed_guard_1 = require("./guards/confirmed.guard");
const users_1 = require("@hsuite/users");
let AuthModule = AuthModule_1 = class AuthModule {
    constructor(redis) {
        this.redis = redis;
    }
    static async forRootAsync(options) {
        let factory = await options.useFactory();
        return {
            module: AuthModule_1,
            imports: [
                users_1.UsersModule,
                passport_1.PassportModule.register({
                    useFactory: () => ({
                        defaultStrategy: factory.commonOptions.passport,
                        session: true
                    }),
                }),
                jwt_1.JwtModule.registerAsync({
                    useFactory: () => factory.commonOptions.jwt
                }),
                ...(factory.web2.enabled && !factory.web3.enabled ?
                    [src_1.AuthWeb2Module.forRootAsync({
                            useFactory: async () => ({
                                jwt: factory.commonOptions.jwt,
                                operator: factory.commonOptions.operator,
                                confirmation_required: factory.web2.options.confirmation_required,
                                admin_only: factory.web2.options.admin_only,
                                passport: factory.commonOptions.passport,
                                sendMailOptions: factory.web2.options.sendMailOptions,
                                mailerOptions: factory.web2.options.mailerOptions,
                                twilioOptions: factory.web2.options.twilioOptions
                            })
                        })] :
                    [src_2.AuthWeb3Module.forRootAsync({
                            imports: options.imports,
                            inject: options.inject,
                            useFactory: async () => ({
                                jwt: factory.commonOptions.jwt,
                                operator: factory.commonOptions.operator,
                                passport: factory.commonOptions.passport,
                                tokenGateOptions: factory.web3.options.tokenGateOptions
                            })
                        })])
            ],
            controllers: [
                auth_controller_1.AuthController
            ],
            providers: [
                {
                    provide: 'authOptions',
                    useFactory: options.useFactory,
                    inject: [options.useExisting]
                },
                auth_service_1.AuthService,
                jwt_strategy_1.JwtStrategy,
                session_serializer_1.SessionSerializer,
                {
                    provide: 'JwtAuthService',
                    useExisting: jwt_1.JwtService,
                },
                ...(factory.commonOptions.passport == types_1.IAuth.IConfiguration.IPassportStrategy.REDIS ?
                    [{
                            provide: core_1.APP_GUARD,
                            useClass: redis_guard_1.RedisAuthGuard,
                        }] :
                    [{
                            provide: core_1.APP_GUARD,
                            useClass: jwt_guard_1.JwtAuthGuard,
                        }]),
                ...(factory.web2.enabled && factory.web2.options.confirmation_required ?
                    [{
                            provide: core_1.APP_GUARD,
                            useClass: confirmed_guard_1.ConfirmedAuthGuard,
                        }] : [])
            ],
            exports: [
                auth_service_1.AuthService,
                jwt_strategy_1.JwtStrategy,
                session_serializer_1.SessionSerializer,
                'JwtAuthService'
            ]
        };
    }
    configure(consumer) {
        if (this.redis != null) {
            const RedisStore = require("connect-redis").default;
            let store = new RedisStore({ client: this.redis.client, logErrors: true });
            consumer
                .apply(session({
                store: store,
                secret: process.env.SESSION_SECRET,
                resave: false,
                saveUninitialized: true,
                proxy: true,
                name: this.redis.appName,
                cookie: this.redis.cookieOptions,
            }), passport.initialize(), passport.session())
                .forRoutes('*');
        }
    }
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = AuthModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            redis_module_1.RedisAuthModule
        ]
    }),
    __param(0, (0, common_1.Inject)(redis_constants_1.AUTHREDIS)),
    __metadata("design:paramtypes", [Object])
], AuthModule);
//# sourceMappingURL=auth.module.js.map