"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisAuthModule = void 0;
const common_1 = require("@nestjs/common");
const Redis = require("redis");
const redis_constants_1 = require("./redis.constants");
const config_1 = require("@nestjs/config");
const types_1 = require("@hsuite/types");
let RedisAuthModule = class RedisAuthModule {
};
exports.RedisAuthModule = RedisAuthModule;
exports.RedisAuthModule = RedisAuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule
        ],
        providers: [
            {
                provide: redis_constants_1.AUTHREDIS,
                useFactory: async (config) => {
                    let passport = config.get('auth.commonOptions.passport');
                    if (passport == types_1.IAuth.IConfiguration.IPassportStrategy.REDIS) {
                        let redis = config.get('auth.commonOptions.redis');
                        let cookieOptions = config.get('auth.commonOptions.cookieOptions');
                        let appName = config.get('auth.commonOptions.appName');
                        const client = Redis.createClient({
                            url: `redis://default:${redis.password}@${redis.socket.host}:${redis.socket.port}`,
                            legacyMode: false
                        });
                        await client.connect();
                        return {
                            client: client,
                            cookieOptions: cookieOptions,
                            appName: appName
                        };
                    }
                    else {
                        return null;
                    }
                },
                inject: [config_1.ConfigService]
            },
        ],
        exports: [redis_constants_1.AUTHREDIS]
    })
], RedisAuthModule);
//# sourceMappingURL=redis.module.js.map