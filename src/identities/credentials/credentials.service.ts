import {LedgerId, PrivateKey, PublicKey, Status, Transaction} from '@hashgraph/sdk';
import {HederaClientHelper} from '@hsuite/helpers';
import {SmartConfigService} from '@hsuite/smart-config';
import {IHedera, ISmartNode} from '@hsuite/types';
import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {InjectModel} from '@nestjs/mongoose';
import {ChainVCStatus, IDCredential, IDCredentialDocument, IDCredentialStatus} from './entities/credential.entity';
import {Model} from 'mongoose';
import {WalletsService} from 'src/wallets/wallets.service';
import {IVC} from 'src/wallets/interfaces/ivc.namespace';
import {ClientService} from '@hsuite/client';
import {Identity, IdentityDocument} from '../entities/identity.entity';
import {Verifiable, W3CCredential} from "did-jwt-vc"
import {AxiosError} from 'axios';
import {IDIssuer, IDIssuerDocument} from '../../issuers/entities/issuer.entity';
import {UserDocument} from '@hsuite/users';
import {HttpService} from '@nestjs/axios';
import {Hashing} from '@hsuite/did-sdk-js';
import {VCStatusChange} from './credentials.controller';
import {CypherService} from 'src/cypher/cypher.service';
import {DiscordLogger} from 'src/common/logger/discord-logger.service';

import { localeData } from 'moment';

export const VcSlStatus = {
    ACTIVE: 0,
    RESUMED: 1,
    SUSPENDED: 2,
    REVOKED: 3,
};

@Injectable()
export class CredentialsService {

    private readonly logger = new Logger(CredentialsService.name)

    private environment: string;
    private node: IHedera.IOperator;
    private hederaClient: HederaClientHelper;
    private pinata = {
        baseUrl: 'https://api.pinata.cloud/',
        pinEndPoint: 'pinning/pinJSONToIPFS',
        unpinEndPoint: 'pinning/unpin',
    };

     private pinataAuth = {
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIyMjRmZTA3My1hZWVhLTQzODItODU3Ny04Njg1NjdhN2VkOGUiLCJlbWFpbCI6ImVjb3NwaGVyZTVAc2NpY29tLm15IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImEwYjFhMGU1NTI1MDU5NTc1MzdlIiwic2NvcGVkS2V5U2VjcmV0IjoiZTVmNzI5OGJmYjc4NTkzM2JiMjI2NTQzNzk3MGUwMTk2N2M4ODFlNzcwNGY5NDhmNzcxY2QzOTYwYWQ3Mjg3YyIsImV4cCI6MTc3NzAxOTk5Nn0.DL8kAvohvHCgwV93EZIFngHdsjr58K2JUwf9vbMwQ8w'
    };

    constructor(
        private readonly nodeClientService: ClientService,
        private smartConfigService: SmartConfigService,
        private configService: ConfigService,
        private walletsService: WalletsService,
        private httpService: HttpService,
        private cypherService: CypherService,
        private discordLogger: DiscordLogger,
        @InjectModel(IDCredential.name) private credentialModel: Model<IDCredentialDocument>,
        @InjectModel(IDIssuer.name) private issuerModel: Model<IDIssuerDocument>,
        @InjectModel(Identity.name) private identityModel: Model<IdentityDocument>
    ) {
        this.environment = this.configService.get<string>('environment');
        this.node = this.configService.get<IHedera.IOperator>(`${this.environment}.node`);

        this.hederaClient = new HederaClientHelper(
            LedgerId.fromString(this.smartConfigService.getEnvironment()),
            this.smartConfigService.getOperator(),
            this.smartConfigService.getMirrorNode()
        );
    }

    private async getIdentityForUser(
        userId: string
    ): Promise<IdentityDocument> {
        return new Promise(async (resolve, reject) => {
            try {
                let identity: IdentityDocument = await this.identityModel.findOne({
                    owner: userId
                });
                if (!identity) {
                    this.logger.log(`No existing identity found, creating new DID - userId: ${userId}, method: CredentialsService.getIdentityForUser()`);

                    const publicKeyMultibase = Hashing.multibase.encode(
                        PublicKey.fromString(this.node.publicKey).toBytes()
                    );

                    let did: IHedera.IDID.IDocument.IInfo = (await this.nodeClientService.axios.post(
                        `/did`, {
                        publicKeyMultibase: publicKeyMultibase
                    })).data;

                    identity = await this.identityModel.create({
                        did_id: did.id,
                        owner: userId
                    });


                            this.logger.log(`New identity created successfully - userId: ${userId}, didId: ${did.id}, method: CredentialsService.getIdentityForUser()`);
                } else {
                    this.logger.log(`Existing identity found - userId: ${userId}, didId: ${identity.did_id}, method: CredentialsService.getIdentityForUser()`);
                }


                resolve(identity);
            } catch (error) {
                this.logger.error(`Error fetching user identity - userId: ${userId}, error: ${error.message}, method: CredentialsService.getIdentityForUser()`, error.stack);
                reject(error);
            }
        });
    }

    async getIssuerForOwner(
        ownerId: string,
        issuerId?: string
    ): Promise<IDIssuer> {
        return new Promise(async (resolve, reject) => {
            try {
                let filters = {
                    owner: ownerId
                }

                if (issuerId) {
                    filters['issuer'] = issuerId;
                }

                let issuer: IDIssuer = await this.issuerModel.findOne(filters);

                if (!issuer) {
                    this.logger.log(`No issuer found - ownerId: ${ownerId}, issuerId: ${issuerId}, method: CredentialsService.getIssuerForOwner()`);
                    throw new Error('IDIssuer not found.');
                }

                this.logger.log(`Issuer retrieved successfully - ownerId: ${ownerId}, issuerId: ${issuer.issuer}, method: CredentialsService.getIssuerForOwner()`);
                resolve(issuer);
            } catch (error) {
                this.logger.error(`Error fetching issuer - ownerId: ${ownerId}, issuerId: ${issuerId}, error: ${error.message}, method: CredentialsService.getIssuerForOwner()`, error.stack);
                reject(error);
            }
        });
    }

    async changeVCStatus(
        sessionId: string,
        userId: string,
        issuerId: string,
        credetialId: string,
        payload: VCStatusChange,
        wipeNFTWithOutChangeVC: boolean
    ): Promise<{_id: string, internal_status: string, chain_status: string;}> {
        return new Promise(async (resolve, reject) => {
            try {
                this.logger.log(`Attempting to change VC status for credential ${credetialId}`);

                let issuer: IDIssuer = await this.getIssuerForOwner(sessionId, issuerId);

                let credential: IDCredentialDocument = await this.credentialModel.findById(credetialId);

                if (!credential) {
                    this.logger.warn(`No active credential found for ID ${credetialId}`);

                    throw new Error(`User does not have an active credential issued by ${issuer.issuer}`);
                }

                // SMART-NODE CALL: asking the smart-nodes to change the status of VC document...
                if (!wipeNFTWithOutChangeVC) {
                    let verifiableCredential: Verifiable<W3CCredential> = (await this.nodeClientService.axios.put(
                        `/did/status/${credential.file_id}/${credential.file_index}`, {
                        status: payload.status != ChainVCStatus.EXPIRED ? payload.status : ChainVCStatus.REVOKED
                    })).data;
                }
                let fileIdStatus = await this.nodeClientService.axios.get(`/did/status/${credential.file_id}`)
                let status = await this.decodeVCStatus(fileIdStatus.data.credentialSubject.encodedList, credential.file_index)

                // in case the VC has been revoked, we need to unfreeze and burn the NFT...
                if (payload.status == ChainVCStatus.REVOKED) {
                    credential = await this.unfreezeNft(credential, issuer);
                    credential = await this.wipeNft(credential, issuer);
                    credential = await this.freezeNft(credential, issuer);
                }
                // credential.chain_status = payload.status;
                if (!wipeNFTWithOutChangeVC) {
                    credential.chain_status = status.toLowerCase();
                } else {
                    credential.chain_status = payload.status;
                }
                credential.markModified('chain_status');

                // if(payload.status == ChainVCStatus.EXPIRED) {
                credential.internal_status = payload.status;
                credential.markModified('internal_status');
                // }

                await credential.save();

                this.logger.log(`Credential status updated successfully - userId: ${credetialId}, method: CredentialsService.changeVCStatus()`);

                const status_return = {
                    _id: credetialId,
                    internal_status: credential.internal_status,
                    chain_status: credential.chain_status,

                };

                resolve(status_return);
            } catch (error) {
                this.logger.error(`Error in changeVCStatus - sessionId: ${credetialId}, error: ${error?.message}, method: CredentialsService.changeVCStatus()`);

                await this.discordLogger.error(`changeVCStatus error: ${error.message}`, error.stack, 'CredentialsService.changeVCStatus');

                if (error instanceof AxiosError) {
                    reject(new Error(error.response?.data?.message));
                } else {
                    reject(new Error(error.message));
                }
            }
        })
    }

    async decodeVCStatus(encodedList: string, vcStatusListIndex: number): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const rl = require("vc-revocation-list");
                const decodedStatusList = await rl.decodeList({
                    encodedList: encodedList,
                });

                const firstBit = Number(decodedStatusList.isRevoked(vcStatusListIndex)).toString();
                const secondBit = Number(decodedStatusList.isRevoked(vcStatusListIndex + 1)).toString();

                const statusIndex = parseInt(`${firstBit}${secondBit}`, 2);
                const status = Object.keys(VcSlStatus).find((key) => VcSlStatus[key] === statusIndex);
                this.logger.log(`VC status decoded - status: ${status}`);
                resolve(status);
            } catch (error) {
                this.logger.error(`Error decoding VC status - encodedListLength: ${encodedList.length}, vcStatusListIndex: ${vcStatusListIndex}, error: ${error.message}, method: CredentialsService.decodeVCStatus()`, error.stack);
                reject(error);
            }
        });
    }

    async fetchVC(
        issuerSession: UserDocument,
        userId: string,
        issuerId: string
    ): Promise<Array<{
        credential: IDCredentialDocument,
        verifiableCredential: Verifiable<W3CCredential>
    }>> {
        return new Promise(async (resolve, reject) => {
            try {
                this.logger.log(`Fetching verifiable credentials - userId: ${userId}, issuerId: ${issuerId}, issuerRole: ${issuerSession.role}`);
                let issuer: IDIssuer = await this.getIssuerForOwner(<string>issuerSession._id, issuerId);

                let filters = {
                    owner: userId
                }

                if (issuerSession.role != 'admin') {
                    filters['issuer'] = issuer.issuer;
                }

                let credentials: Array<IDCredentialDocument> = await this.credentialModel.find(filters);

                if (!credentials || credentials.length == 0) {
                    throw new Error(`User does not have an active credential issued by ${issuer.issuer}`);
                }

                let verifiableCredentialsRequests = credentials.map(credential =>
                    this.nodeClientService.axios.get(`/did/status/${credential.file_id}`));

                let verifiableCredentialsResponses = await Promise.all(verifiableCredentialsRequests);

                let credentialsStatusRequests = verifiableCredentialsResponses.map((response, index) =>
                    this.decodeVCStatus(response.data.credentialSubject.encodedList, credentials[index].file_index));
                let credentialsStatusResponses = await Promise.all(credentialsStatusRequests);
                console.log('credentialsStatusResponses123', credentialsStatusResponses);

                let verifiableCredentials = verifiableCredentialsResponses.map((response: any, index) => {
                    credentials[index].chain_status = credentialsStatusResponses[index];
                    // this.logger.info({
                    //     msg: 'Verifiable credentials fetched',
                    //     credentialsCount: verifiableCredentials.length
                    // });
                    return {
                        credential: credentials[index],
                        verifiableCredential: response.data
                    }
                });

                resolve(verifiableCredentials);
            } catch (error) {
                this.logger.error(`Error fetching verifiable credentials - userId: ${userId}, issuerId: ${issuerId}, error: ${error.message}, method: CredentialsService.fetchVC()`, error.stack);
                await this.discordLogger.error(`fetchVC error: ${error.message}`, error.stack, 'CredentialsService.fetchVC');
                if (error instanceof AxiosError) {
                    reject(new Error(error.response?.data?.message));
                } else {
                    reject(new Error(error.message));
                }
            }
        })
    }

    async issueVC(
        sessionId: string,
        userId: string,
        issuerId: string,
        base64metadata: string,
        expiration_date: string
    ): Promise<IDCredential> {
        return new Promise(async (resolve, reject) => {
            try {
                this.logger.log(`Issuing Verifiable Credential - userId: ${userId}, issuerId: ${issuerId}, expirationDate: ${expiration_date}`);
                let issuer: IDIssuer = await this.getIssuerForOwner(sessionId, issuerId);
                let identity: IdentityDocument = await this.getIdentityForUser(userId);

                // checking if the user already has an pending VC for that issuer
                // so to allow the recovery of a failed VC...
                let credential: IDCredentialDocument = await this.credentialModel.findOne({
                    owner: userId,
                    issuer: issuer.issuer,
                    chain_status: 'active',
                    internal_status: {$in: [IDCredentialStatus.PENDING, IDCredentialStatus.MINTED, IDCredentialStatus.DELIVERED, IDCredentialStatus.ACTIVE]}
                });

                //if the user already has an active credential, we throw an error... ()
                if (credential && credential.internal_status == IDCredentialStatus.ACTIVE) {
                    this.logger.warn(`User already has an active credential with issuer ${issuer.issuer}.`);
                     resolve(credential.toJSON());
                     console.log('User already has an active credential with issuer', issuer.issuer);
                     return;
                }

                // if the user does not have an identity, we create a new one...
                if (!credential) {
                    // associate the user WalletID with the IDIssuer's NFT...
                    // try {
                    //     await this.associateNFT(userId, issuer.nftID);
                    // } catch (error) {
                    //     if (!error.message.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
                    //         throw new Error('Failed to associate NFT.');
                    //     }
                    // }

                    // if the user does not have an identity, we create a new one...
                    credential = await this.registerVC(userId, issuer, expiration_date);
                    identity.credentials.push(<IDCredential>credential._id);
                    identity.markModified('credentials');
                    await identity.save();

                    // minting the nft...
                    credential = await this.mintNft(credential, issuer, base64metadata, userId);

                    // trying to unfreeze the nft, in case it is already frozen...

                    await this.unfreezeNft(credential, issuer);


                    // send the nft to the user wallet...
                    credential = await this.sendNft(credential, issuer);

                    // freezing the nft into the user wallet...
                    credential = await this.freezeNft(credential, issuer);
                }
                // if the user has an identity, but it is not active, we try to mint/deliver the nft again...
                else {
                    switch (credential.internal_status) {
                        case IDCredentialStatus.PENDING:
                            // minting the nft...
                            credential = await this.mintNft(credential, issuer, base64metadata, userId);

                            // trying to unfreeze the nft, in case it is already frozen...

                            await this.unfreezeNft(credential, issuer);


                            // send the nft to the user wallet...
                            credential = await this.sendNft(credential, issuer);
                            // freezing the nft into the user wallet...
                            credential = await this.freezeNft(credential, issuer);
                            credential;
                        case IDCredentialStatus.MINTED:
                            await this.unfreezeNft(credential, issuer);


                            // send the nft to the user wallet...
                            credential = await this.sendNft(credential, issuer);
                            // freezing the nft into the user wallet...
                            credential = await this.freezeNft(credential, issuer);
                            break;
                        case IDCredentialStatus.DELIVERED:
                            // freezing the nft into the user wallet...
                            credential = await this.freezeNft(credential, issuer);
                            break;
                    }
                }

                resolve(credential.toJSON());
            } catch (error) {
                this.logger.error(`Error in issueVC - userId: ${userId}, issuerId: ${issuerId}, error: ${error.message}`);
                if (error instanceof AxiosError) {
                    reject(new Error(error.response?.data?.message));
                } else {
                    reject(new Error(error.message));
                }
                await this.discordLogger.error(`issueVC error: ${error.message} for user ${userId}`, error.stack, 'CredentialsService.issueVC()');
            }
        })
    }

    async registerVC(
        userId: string,
        issuer: IDIssuer,
        expiration_date: string
    ): Promise<IDCredentialDocument> {
        return new Promise(async (resolve, reject) => {
            try {
                this.logger.log(`Registering new VC - userId: ${userId}, issuer: ${issuer.issuer}, expirationDate: ${expiration_date}`);

                // SMART-NODE CALL: asking the smart-nodes to register the VC document...
                let register: IHedera.IDID.IVC.IList.IResponse = (await this.nodeClientService.axios.post(
                    `/did/register`, {
                    issuerDID: `${issuer.did_id}#key-1`,
                })).data;

                let credential: IDCredentialDocument = await this.credentialModel.create({
                    owner: userId,
                    issuer: issuer.issuer,
                    file_id: register.fileId,
                    file_index: register.statusInfo.statusListIndex,
                    serial_number: 'to_be_minted',
                    iv: null,
                    internal_status: IDCredentialStatus.PENDING,
                    chain_status: ChainVCStatus.ACTIVE,
                    expiration_date: new Date(Number(expiration_date))
                });
                this.logger.log(`VC registered successfully - credentialId: ${credential._id}, fileId: ${credential.file_id}`);
                resolve(credential);
            } catch (error) {
                this.logger.error(`Error registering VC - userId: ${userId}, issuer: ${issuer.issuer}, error: ${error.message}, method: CredentialsService.registerVC()`, error.stack);
                if (error.message.includes('All promises were rejected')) {
                    console.info("All promises were rejected")
                } else {
                    await this.discordLogger.error(`registerVC error: ${error.message} for user ${userId}`, error.stack, 'CredentialsService.registerVC()');
                }
                if (error instanceof AxiosError) {
                    reject(new Error(error.response?.data?.message));
                } else {
                    reject(new Error(error.message));
                }
            }
        });
    }

    private async associateNFT(
        userId: string,
        nftId: string
    ): Promise<ISmartNode.ISmartTransaction.IDetails> {
        return new Promise(async (resolve, reject) => {
            try {
                this.logger.log(`Associating NFT - userId: ${userId}, nftId: ${nftId}`);
                let wallet: IVC.Wallet.History = await this.walletsService.getWallet(userId);

                if (!wallet) {
                    throw new Error('User does not have a wallet.');
                }

                let associate: ISmartNode.ISmartTransaction.IDetails = await this.walletsService.associateToken({
                    walletId: wallet.id,
                    tokenId: nftId
                });
                this.logger.log(`NFT associated successfully - userId: ${userId}, nftId: ${nftId}, walletId: ${wallet.id}`);
                resolve(associate);
            } catch (error) {
                this.logger.error(`Error associating NFT - userId: ${userId}, nftId: ${nftId}, error: ${error.message}, method: CredentialsService.associateNFT()`, error.stack);
                await this.discordLogger.error(`associateNFT error: ${error.message} for user ${userId}`, error.stack, 'CredentialsService.associateNFT()');
                reject(error);
            }
        });
    }

    private async mintNft(
        credential: IDCredentialDocument,
        issuer: IDIssuer,
        base64metadata: string,
        owner: string
    ): Promise<IDCredentialDocument> {
        return new Promise(async (resolve, reject) => {
            try {

                const metadata = Buffer.from(base64metadata, 'base64').toString();
                const vcMetadata = JSON.parse(metadata);
                const encoded = await this.cypherService.encrypt(JSON.stringify(vcMetadata));

                const nftMetadata = {
                    name: `iKad - Verifiable Credential`,
                    description: `International Student Identity Card issued by Education Malaysia Global Services (EMGS)`,
                    creator: 'EMGS',
                    properties: {
                        encryptedText: encoded.encryptedText
                    },
                    image: issuer.imageCID
                }
                // Add custom metadata
                const pinatametadata = JSON.stringify({
                    name: owner,  // This sets the custom file name
                });
                let pinataData = JSON.stringify({
                    "pinataOptions": {
                        "cidVersion": 0
                    },
                    "pinataMetadata": pinatametadata,
                    "pinataContent": nftMetadata
                });

                let response = await this.httpService.post(
                    `${this.pinata.baseUrl}${this.pinata.pinEndPoint}`,
                    pinataData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.pinataAuth.jwt}`
                        }
                    }).toPromise();

                // SMART-NODE CALL: asking the smart-nodes to mint the nft...
                let mintBytes = (await this.nodeClientService.axios.post(
                    `/hts/mint/nft`, {
                    token_id: issuer.nftID,
                    cid: `ipfs://${response.data.IpfsHash}`
                })).data;

                // smart-nodes will return a bytes transaction, ready to be signed and submitted to the network...
                let transaction = Transaction.fromBytes(new Uint8Array(Buffer.from(mintBytes)));
                const client = this.hederaClient.getClient();

                // signing and submitting the transaction...
                // NOTE: the identityTokenID has been created by the same operator of this smart-app, so we can use the same private key.
                const signTx = await transaction.sign(PrivateKey.fromString(this.node.privateKey));

                // submitting the transaction...
                const submitTx = await signTx.execute(client);
                const receipt = await submitTx.getReceipt(client);

                if (receipt.status == Status.Success) {
                    credential.iv = encoded.iv;
                    credential.markModified('iv');

                    credential.serial_number = receipt.serials.toString();
                    credential.markModified('serial_number');

                    credential.internal_status = IDCredentialStatus.MINTED;
                    credential.markModified('status');

                    await credential.save();

                    this.logger.log(`NFT minted successfully - credentialOwner: ${credential.owner}, serialNumber: ${credential.serial_number}, ipfsHash: ${response.data.IpfsHash}`);
                    resolve(credential);
                } else {
                    reject('Transaction failed');
                }
            } catch (error) {
                this.logger.error(`Error minting NFT - credentialOwner: ${credential.owner}, issuer: ${issuer.issuer}, error: ${error.message}, method: CredentialsService.mintNft()`, error.stack);
                await this.discordLogger.error(`mintNft error: ${error.message} for user ${credential.owner}`, error.stack, 'CredentialsService.mintNft()');
                if (error instanceof AxiosError) {
                    reject(new Error(error.response?.data?.message));
                } else {
                    reject(new Error(error.message));
                }
            }
        })
    }

    private async sendNft(
        credential: IDCredentialDocument,
        issuer: IDIssuer
    ): Promise<IDCredentialDocument> {
        return new Promise(async (resolve, reject) => {
            try {


                let wallet: IVC.Wallet.History = await this.walletsService.getWallet(credential.owner);
                if (!wallet) {
                    throw new Error('User does not have a wallet.');
                }
                let nftInfo = await this.walletsService.getNftInfo(issuer.nftID, credential.serial_number);

                if (nftInfo && nftInfo.account_id == wallet.id) {

                    console.info('NFT already in the student wallet');
                    credential.internal_status = IDCredentialStatus.DELIVERED;
                    credential.markModified('status');

                    await credential.save();
                    resolve(credential);
                } else {
                    console.info('NFT in the tressury wallet');
                }

                if (wallet.balance.tokens.length > 10) {
                    try {
                        await this.associateNFT(credential.owner, issuer.nftID);
                    } catch (error) {
                        if (!error.message.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
                            throw new Error('Failed to associate NFT.');
                        }
                    }
                }


                // SMART-NODE CALL: asking the smart-nodes to send the nft...
                let sendBytes = (await this.nodeClientService.axios.post(
                    `/hts/transfer/nft`, {
                    nft: issuer.nftID,
                    sender: this.node.accountId,
                    receiver: wallet.id,
                    serial_number: credential.serial_number,
                    memo: `${issuer.issuer} - Identity NFT transfer to ${wallet.id} (#${credential.owner}) #${credential.serial_number}.`
                })).data;

                // smart-nodes will return a bytes transaction, ready to be signed and submitted to the network...
                let transaction = Transaction.fromBytes(new Uint8Array(Buffer.from(sendBytes)));
                const client = this.hederaClient.getClient();

                // signing and submitting the transaction...
                // NOTE: the identityTokenID has been created by the same operator of this smart-app, so we can use the same private key.
                const signTx = await transaction.sign(PrivateKey.fromString(this.node.privateKey));

                // submitting the transaction...
                const submitTx = await signTx.execute(client);
                const receipt = await submitTx.getReceipt(client);

                if (receipt.status == Status.Success) {
                    this.logger.log(`NFT sent successfully - credentialOwner: ${credential.owner}, issuer: ${issuer.issuer}, serialNumber: ${credential.serial_number}, transactionId: ${submitTx.transactionId.toString()}`);

                    credential.internal_status = IDCredentialStatus.DELIVERED;
                    credential.markModified('status');

                    await credential.save();
                    resolve(credential);
                } else {
                    reject('Transaction failed');
                }
            } catch (error) {
                this.logger.error(`Error sending NFT - credentialOwner: ${credential.owner}, issuer: ${issuer.issuer}, serialNumber: ${credential.serial_number}, error: ${error.message}, method: CredentialsService.sendNft()`, error.stack);
                if (error.message.includes('All promises were rejected')) {
                    console.info(error)
                } else {
                    await this.discordLogger.error(`sendNft() error: ${error.message} for user ${credential.owner}`, error.stack, 'CredentialsService.sendNft()');
                }
                if (error instanceof AxiosError) {
                    reject(new Error(error.response?.data?.message));
                } else {
                    reject(new Error(error.message));
                }
            }
        });
    }

    private async freezeNft(
        credential: IDCredentialDocument,
        issuer: IDIssuer
    ): Promise<IDCredentialDocument> {
        return new Promise(async (resolve, reject) => {
            try {
                let wallet: IVC.Wallet.History = await this.walletsService.getWallet(credential.owner);
                let tokenStatus = await this.walletsService.getToken(credential.owner);
                console.info('FREEZ getToken', tokenStatus);
                if (
                    tokenStatus &&
                    tokenStatus.tokens &&
                    tokenStatus.tokens.length > 0 &&
                    'freeze_status' in tokenStatus.tokens[0] &&
                    tokenStatus.tokens[0].freeze_status === 'FROZEN' &&
                    tokenStatus.tokens[0].token_id === issuer.nftID
                ) {
                    this.logger.log(`NFT freeze_status is FROZEN for the student wallet ${wallet.id} - owner: ${credential.owner}`);
                    credential.internal_status = IDCredentialStatus.ACTIVE;
                    credential.markModified('status');
                    await credential.save();
                    resolve(credential);
                    return;
                }
                if (!wallet) {
                    throw new Error('User does not have a wallet.');
                }

                // SMART-NODE CALL: asking the smart-nodes to send the nft...
                let sendBytes = (await this.nodeClientService.axios.post(
                    `/hts/freeze/${issuer.nftID}`, {
                    walletId: wallet.id,
                })).data;

                // smart-nodes will return a bytes transaction, ready to be signed and submitted to the network...
                let transaction = Transaction.fromBytes(new Uint8Array(Buffer.from(sendBytes)));
                const client = this.hederaClient.getClient();

                // signing and submitting the transaction...
                // NOTE: the identityTokenID has been created by the same operator of this smart-app, so we can use the same private key.
                const signTx = await transaction.sign(PrivateKey.fromString(this.node.privateKey));

                // submitting the transaction...
                const submitTx = await signTx.execute(client);
                const receipt = await submitTx.getReceipt(client);

                if (receipt.status == Status.Success) {
                    credential.internal_status = IDCredentialStatus.ACTIVE;
                    credential.markModified('status');

                    await credential.save();
                    resolve(credential);
                } else {
                    reject('Transaction failed');
                }
            } catch (error) {
                this.logger.error(`freezeNft error: ${error.message} for user ${credential.owner} - owner: ${credential.owner}, error: ${error.message}, method: CredentialsService.changeVCStatus()`, error.stack);
                await this.discordLogger.error(`freezeNft error: ${error.message} for user ${credential.owner}`, error.stack, 'CredentialsService.freezeNft()');
                if (error instanceof AxiosError) {
                    reject(new Error(error.response?.data?.message));
                } else {
                    reject(new Error(error.message));
                }
            }
        });
    }

    private async unfreezeNft(
        credential: IDCredentialDocument,
        issuer: IDIssuer
    ): Promise<IDCredentialDocument> {
        return new Promise(async (resolve, reject) => {
            try {
                let wallet: IVC.Wallet.History = await this.walletsService.getWallet(credential.owner);
                let tokenStatus = await this.walletsService.getToken(credential.owner);
                if (
                    tokenStatus &&
                    tokenStatus.tokens &&
                    tokenStatus.tokens.length == 0
                ) {
                    this.logger.log(`UNFROZEN: TOKEN_NOT_ASSOCIATED_TO_ACCOUNT UNFROZEN for the student wallet ${wallet.id} - walletId: ${wallet.id}, owner: ${credential.owner}, method: CredentialsService.unfreezeNft()`);
                    resolve(credential);
                    return;
                }
                if (
                    tokenStatus &&
                    tokenStatus.tokens &&
                    tokenStatus.tokens.length > 0 &&
                    'freeze_status' in tokenStatus.tokens[0] &&
                    tokenStatus.tokens[0].freeze_status === 'UNFROZEN' &&
                    tokenStatus.tokens[0].token_id === issuer.nftID
                ) {
                    this.logger.log(`NFT freeze_status is UNFROZEN for the student wallet ${wallet.id} - walletId: ${wallet.id}, owner: ${credential.owner}, method: CredentialsService.changeVCStatus()`);
                    resolve(credential);
                    return;
                }
                if (!wallet) {
                    throw new Error('User does not have a wallet.');
                }

                // SMART-NODE CALL: asking the smart-nodes to send the nft...
                let sendBytes = (await this.nodeClientService.axios.post(
                    `/hts/unfreeze/${issuer.nftID}`, {
                    walletId: wallet.id,
                })).data;

                // smart-nodes will return a bytes transaction, ready to be signed and submitted to the network...
                let transaction = Transaction.fromBytes(new Uint8Array(Buffer.from(sendBytes)));
                const client = this.hederaClient.getClient();

                // signing and submitting the transaction...
                // NOTE: the identityTokenID has been created by the same operator of this smart-app, so we can use the same private key.
                const signTx = await transaction.sign(PrivateKey.fromString(this.node.privateKey));

                // submitting the transaction...
                const submitTx = await signTx.execute(client);
                const receipt = await submitTx.getReceipt(client);

                if (receipt.status == Status.Success) {
                    resolve(credential);
                } else {
                    reject('Transaction failed');
                }
            } catch (error) {
                if (error.message.includes('_NOT_ASSOCIATED_TO_')) {
                    this.logger.log(`Resolving -- TOKEN_NOT_ASSOCIATED_TO_ACCOUNT UNFROZEN for the student wallet ${credential.owner} - owner: ${credential.owner}, method: CredentialsService.unfreezeNft()`);
                    resolve(credential);
                    return;
                }
                await this.discordLogger.error(`unfreezeNft error: ${error.message} for[] user ${credential.owner}`, error.stack, 'CredentialsService.unfreezeNft()');
                if (error instanceof AxiosError) {
                    reject(new Error(error.response?.data?.message));
                } else {
                    reject(new Error(error.message));
                }
            }
        });
    }

    private async wipeNft(
        credential: IDCredentialDocument,
        issuer: IDIssuer
    ): Promise<IDCredentialDocument> {
        return new Promise(async (resolve, reject) => {
            try {
                let wallet: IVC.Wallet.History = await this.walletsService.getWallet(credential.owner);
                if (!wallet) {
                    throw new Error('User does not have a wallet.');
                }

                // SMART-NODE CALL: asking the smart-nodes to send the nft...
                let sendBytes = (await this.nodeClientService.axios.post(
                    `/hts/wipe/nft`, {
                    token_id: issuer.nftID,
                    serial_number: credential.serial_number,
                    account_id: wallet.id
                })).data;

                // smart-nodes will return a bytes transaction, ready to be signed and submitted to the network...
                let transaction = Transaction.fromBytes(new Uint8Array(Buffer.from(sendBytes)));
                const client = this.hederaClient.getClient();

                // signing and submitting the transaction...
                // NOTE: the identityTokenID has been created by the same operator of this smart-app, so we can use the same private key.
                const signTx = await transaction.sign(PrivateKey.fromString(this.node.privateKey));

                // submitting the transaction...
                const submitTx = await signTx.execute(client);
                const receipt = await submitTx.getReceipt(client);

                if (receipt.status == Status.Success) {
                    this.logger.log(`NFT wiped successfully - credentialOwner: ${credential.owner}, issuer: ${issuer.issuer}, serialNumber: ${credential.serial_number}, transactionId: ${submitTx.transactionId.toString()}`);
                    credential.internal_status = IDCredentialStatus.BURNED;
                    credential.markModified('status');
                    await credential.save();

                    resolve(credential);
                } else {
                    reject('Transaction failed');
                }
            } catch (error) {
                this.logger.error(`Error wiping NFT - credentialOwner: ${credential.owner}, issuer: ${issuer.issuer}, serialNumber: ${credential.serial_number}, error: ${error.message}, method: CredentialsService.wipeNft()`, error.stack);
                await this.discordLogger.error(`wipeNft error: ${error.message}`, error.stack, 'CredentialsService.wipeNft()');
                if (error instanceof AxiosError) {
                    reject(new Error(error.response?.data?.message));
                } else {
                    reject(new Error(error.message));
                }
            }
        });
    }
}
