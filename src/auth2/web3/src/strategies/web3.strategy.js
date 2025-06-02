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
exports.Web3Strategy = void 0;
const passport_custom_1 = require("passport-custom");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const web3_service_1 = require("../auth/web3.service");
let Web3Strategy = class Web3Strategy extends (0, passport_1.PassportStrategy)(passport_custom_1.Strategy, 'web3') {
    constructor(web3Service) {
        super();
        this.web3Service = web3Service;
    }
    async validate(request) {
        let payload = request.body;
        const wallet = await this.web3Service.validateWallet(payload);
        if (!wallet) {
            throw new common_1.UnauthorizedException();
        }
        return wallet;
    }
};
exports.Web3Strategy = Web3Strategy;
exports.Web3Strategy = Web3Strategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [web3_service_1.AuthWeb3Service])
], Web3Strategy);
//# sourceMappingURL=web3.strategy.js.map