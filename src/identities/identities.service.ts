import { Injectable, Logger } from '@nestjs/common';
import { Hashing } from '@hsuite/did-sdk-js';
import { PublicKey } from '@hashgraph/sdk';
import { ClientService } from '@hsuite/client';
import { ConfigService } from '@nestjs/config';
import { Hedera, IHedera } from '@hsuite/types';
import { InjectModel } from '@nestjs/mongoose';
import { Identity, IdentityDocument } from './entities/identity.entity';
import { Model } from 'mongoose';
import { WalletsService } from 'src/wallets/wallets.service';
import { IVC } from 'src/wallets/interfaces/ivc.namespace';
import { AxiosError } from 'axios';

@Injectable()
export class IdentitiesService {
    private readonly logger = new Logger(IdentitiesService.name);

    private environment: string;
    private node: IHedera.IOperator;

    constructor(
        private readonly nodeClientService: ClientService,
        private configService: ConfigService,
        private walletsService: WalletsService,
        @InjectModel(Identity.name) private identityModel: Model<IdentityDocument>
    ) {
        this.environment = this.configService.get<string>('environment');
        this.node = this.configService.get<IHedera.IOperator>(`${this.environment}.node`);
    }

    async fetchDID(
        userId: string
    ): Promise<{
        identity: IdentityDocument,
        did: Hedera.DID.Document.Info
    }> {
        return new Promise(async (resolve, reject) => {
            try {
          
                // checking if the user already has an identity...
                // we filter out the revoked identities, so to allow creation of new ones...
                let identity: IdentityDocument = await this.identityModel.findOne({
                    owner: userId
                });
                console.log("identity", identity);

                // if the user does not have an identity, we throw an error...
                if (!identity) {
                    throw new Error('User does not have an identity.');
                }

                // SMART-NODE CALL: asking the smart-nodes to fetch the did document...
                let did: IHedera.IDID.IDocument.IInfo = (await this.nodeClientService.axios.get(
                    `/did/${identity.did_id}`)).data;
                this.logger.log(
                    `DID fetched successfully - User: ${userId}, DID: ${did.id}`
                );
                resolve({
                    identity,
                    did
                });
            } catch (error) {
                this.logger.error(
                    `Error fetching DID - User: ${userId}, Error: ${error?.message}`,
                    'IdentitiesService.fetchDID()'
                );
                if(error instanceof AxiosError) {
                    reject(new Error(error.response?.data?.message));
                } else {
                    reject(new Error(error.message));
                }
            }
        })
    }

    async createDID(userId: string): Promise<IdentityDocument> {
        return new Promise(async (resolve, reject) => {
            try {
                // preventing the creation of DID if the user doesn't have a wallet yet...
                let wallet: IVC.Wallet.History = await this.walletsService.getWallet(userId);

                if (!wallet) {
                    throw new Error('User does not have a wallet.');
                }

                let identity: IdentityDocument = await this.identityModel.findOne({
                    owner: userId
                });

                if(identity) {
                    throw new Error('User already has an identity.');
                }

                // right now the hahsgraph-did-sdk works only with single signature, 
                // so we need to encode the public key of the smart-app operator in multibase format.
                // in future we might be able to use the publicKey of the multi-sig wallet of the given userId.
                // NOTE: this is not a security issue at all, just a limitation towards a most complete decentralization.
                const publicKeyMultibase = Hashing.multibase.encode(
                    PublicKey.fromString(this.node.publicKey).toBytes()
                );

                // SMART-NODE CALL: asking the smart-nodes to create the did document...
                let did: IHedera.IDID.IDocument.IInfo = (await this.nodeClientService.axios.post(
                    `/did`, {
                    publicKeyMultibase: publicKeyMultibase
                })).data;

                identity = await this.identityModel.create({
                    did_id: did.id,
                    owner: userId
                });
                this.logger.log(
                    `DID created successfully - User: ${userId}, DID: ${did.id}`
                );
                resolve(identity);
            } catch (error) {
                this.logger.error(
                    `Error creating DID - User: ${userId}, Error: ${error?.message}`,
                    'IdentitiesService.createDID()'
                );
                
                if(error instanceof AxiosError) {
                    reject(new Error(error.response?.data?.message));
                } else {
                    reject(new Error(error.message));
                }
            }
        });
    }
}
