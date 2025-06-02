"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthWeb3Module_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthWeb3Module = void 0;
const common_1 = require("@nestjs/common");
const web3_service_1 = require("./web3.service");
const web3_strategy_1 = require("../strategies/web3.strategy");
const web3_controller_1 = require("./web3.controller");
const axios_1 = require("@nestjs/axios");
let AuthWeb3Module = AuthWeb3Module_1 = class AuthWeb3Module {
    static forRootAsync(options) {
        return {
            module: AuthWeb3Module_1,
            imports: [
                ...options.imports,
                axios_1.HttpModule.register({})
            ],
            controllers: [
                web3_controller_1.AuthWeb3Controller
            ],
            providers: [
                {
                    provide: 'authWeb3Options',
                    useFactory: options.useFactory,
                    inject: options.inject
                },
                web3_service_1.AuthWeb3Service,
                web3_strategy_1.Web3Strategy
            ],
            exports: [
                web3_service_1.AuthWeb3Service,
                web3_strategy_1.Web3Strategy
            ]
        };
    }
};
exports.AuthWeb3Module = AuthWeb3Module;
exports.AuthWeb3Module = AuthWeb3Module = AuthWeb3Module_1 = __decorate([
    (0, common_1.Module)({})
], AuthWeb3Module);
//# sourceMappingURL=web3.module.js.map