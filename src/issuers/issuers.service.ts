import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IDIssuer, IDIssuerDocument } from './entities/issuer.entity';
import { Model } from 'mongoose';
import { IssuerPayload } from './payloads/issuer.payload';
import { Hashing } from '@hsuite/did-sdk-js';
import { PublicKey } from '@hashgraph/sdk';
import { IHedera } from '@hsuite/types';
import { ConfigService } from '@nestjs/config';
import { ClientService } from '@hsuite/client';
import { clearScreenDown } from 'readline';

@Injectable()
export class IssuersService implements OnModuleInit {
    private readonly logger = new Logger(IssuersService.name);

    private node: IHedera.IOperator;
    private environment: string;

    constructor(
        private readonly nodeClientService: ClientService,
        private configService: ConfigService,
        @InjectModel(IDIssuer.name) private issuerModel: Model<IDIssuerDocument>
    ) {
        this.environment = this.configService.get<string>('environment');
        this.node = this.configService.get<IHedera.IOperator>(`${this.environment}.node`);
    }

    async onModuleInit(): Promise<void> {}

    async getIssuers(
    ): Promise<Array<IDIssuer>> {
        return new Promise(async (resolve, reject) => { 
            try {
                const issuers: Array<IDIssuer> = await this.issuerModel.find({ owner: '682bfc6864cec2bcfad2edda' }).exec();
                resolve(issuers);
            } catch(error) {
                reject(error);
            }
        });
    }

    async createIssuer(
        sessionId: string,
        issuer: IssuerPayload
    ): Promise<IDIssuer> {
        return new Promise(async (resolve, reject) => {
            try {

                // in order to have 1 fileID for each issuer, we need to create a new DID for the issuer itself...
                // this did_id will be saved in the DB and used to issue VCs for any credential with a custom fileID...
                const publicKeyMultibase = Hashing.multibase.encode(
                    PublicKey.fromString(this.node.publicKey).toBytes()
                );

                // SMART-NODE CALL: asking the smart-nodes to create the did document...
                let did: IHedera.IDID.IDocument.IInfo = (await this.nodeClientService.axios.post(
                    `/did`, {
                    publicKeyMultibase: publicKeyMultibase
                })).data;

                const issuerDocument: IDIssuerDocument = await this.issuerModel.create({
                    owner: sessionId,
                    did_id: did.id,
                    ...issuer
                });
                this.logger.log(
                    `Issuer created successfully - Session: ${sessionId}, ID: ${issuerDocument._id}, Name: ${issuer.issuer}`
                );
                resolve(issuerDocument.toJSON());
            } catch (error) {
                this.logger.error(
                    `Error creating issuer - Session: ${sessionId}, Error: ${error?.message}`,
                    'IssuersService.createIssuer()'
                );
                reject(error);
            }
        });
    }
}
