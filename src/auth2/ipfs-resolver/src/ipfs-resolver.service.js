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
var IpfsResolverService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpfsResolverService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const lodash = require("lodash");
let IpfsResolverService = IpfsResolverService_1 = class IpfsResolverService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(IpfsResolverService_1.name);
        this.ipfsGateways = [
            'https://cloudflare-ipfs.com/ipfs/',
            'https://ipfs.io/ipfs/',
            'https://ipfs.infura.io/ipfs/',
            'https://ipfs.fleek.co/ipfs/',
            'https://gateway.ipfs.io/ipfs/',
            'https://gateway.pinata.cloud/ipfs/',
            'https://dweb.link/ipfs/'
        ];
    }
    async getFile(ipfsUrl) {
        return new Promise(async (resolve, reject) => {
            try {
                let CID = this.extractCID(ipfsUrl);
                let promises = [];
                this.ipfsGateways.forEach((gateway) => {
                    promises.push(this.httpService.get(`${gateway}${CID}`, { responseType: 'arraybuffer' }).toPromise());
                });
                let response = await Promise.any(promises);
                let buffer = response.data;
                const { fileTypeFromBuffer } = await Promise.resolve().then(() => require('file-type'));
                const type = await fileTypeFromBuffer(buffer);
                resolve({
                    buffer: buffer,
                    type: type
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    extractCID(url) {
        if (url) {
            const regex = new RegExp('(https:\/\/[^?]+\/ipfs\/)?([^?]+)', '');
            let CID = regex.exec(url.replace('ipfs://', ''));
            let cid = lodash.nth(CID, 2);
            if (cid.endsWith('ipfs.dweb.link/')) {
                const dweb = new RegExp('https:\/\/([^?]+)\.ipfs\.dweb\.link\/', '');
                let match = dweb.exec(cid);
                cid = lodash.nth(match, 1);
            }
            return cid;
        }
        else {
            return null;
        }
    }
    async getMetadata(ipfsUrl) {
        return new Promise(async (resolve, reject) => {
            try {
                ipfsUrl = Buffer.from(ipfsUrl, 'base64').toString();
                let CID = this.extractCID(ipfsUrl);
                let metadata = await this.get(CID);
                let image = this.extractCID(metadata.image ? metadata.image : metadata.CID);
                metadata.image = this.getImageUrl(image);
                resolve(metadata);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    getImageUrl(cid) {
        return `https://gateway.pinata.cloud/ipfs/${encodeURIComponent(cid)}?optimizer=image&width=300`;
    }
    async get(CID) {
        return new Promise(async (resolve, reject) => {
            try {
                let promises = [];
                this.ipfsGateways.forEach((gateway) => {
                    promises.push(this.httpService.get(`${gateway}${CID}`).toPromise());
                });
                let response = await Promise.any(promises);
                resolve(response.data);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async onModuleInit() { }
};
exports.IpfsResolverService = IpfsResolverService;
exports.IpfsResolverService = IpfsResolverService = IpfsResolverService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], IpfsResolverService);
//# sourceMappingURL=ipfs-resolver.service.js.map