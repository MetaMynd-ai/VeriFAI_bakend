/// <reference types="node" />
import { Logger, OnModuleInit } from '@nestjs/common';
import core from 'file-type/core';
import { HttpService } from '@nestjs/axios';
export declare class IpfsResolverService implements OnModuleInit {
    private httpService;
    protected logger: Logger;
    private ipfsGateways;
    constructor(httpService: HttpService);
    getFile(ipfsUrl: string): Promise<{
        buffer: Buffer;
        type: core.FileTypeResult;
    }>;
    extractCID(url: string): string;
    getMetadata(ipfsUrl: string): Promise<any>;
    getImageUrl(cid: string): string;
    get(CID: string): Promise<any>;
    onModuleInit(): Promise<void>;
}
