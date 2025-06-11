import {
    Injectable,
    Logger,
    OnModuleInit,
    Inject,  // Added
    forwardRef // Added
} from '@nestjs/common'
import {
    Wallet,
    WalletDocument
} from './entities/wallet.entity'
import {IVC, I_IVC} from './interfaces/ivc.namespace'
import {
    AccountBalanceQuery,
    AccountId,
    LedgerId,
    PrivateKey,
    Status,
    Transaction,
    AccountCreateTransaction
} from '@hashgraph/sdk'
import * as moment from 'moment'
import {Model} from 'mongoose'
import {InjectModel} from '@nestjs/mongoose'
import axios from 'axios';

import {
    IHedera,
    ISmartNode
} from '@hsuite/types'
import {
    WalletTransaction,
    WalletTransactionDocument
} from './entities/transaction.entity'
import {ClientService} from '@hsuite/client'
import {HederaClientHelper} from '@hsuite/helpers'
import {SmartConfigService} from '@hsuite/smart-config'
import Decimal from 'decimal.js'
import {IpfsResolverService} from '@hsuite/ipfs-resolver'
import {IDIssuer, IDIssuerDocument} from 'src/issuers/entities/issuer.entity'
import {IDCredential, IDCredentialDocument} from 'src/identities/credentials/entities/credential.entity'
import {CypherService} from 'src/cypher/cypher.service'
import {ConfigService} from '@nestjs/config'
import * as lodash from 'lodash'
import {DiscordLogger} from 'src/common/logger/discord-logger.service';
import { WalletsKeyService } from '../wallets-key/wallets-key.service';
import { IdentitiesService } from 'src/identities/identities.service';
import { AgentProfileService } from 'src/agent-profile/agent-profile.service';

@Injectable()
export class WalletsService implements OnModuleInit {
    private readonly logger = new Logger(WalletsService.name);

    private hederaClient: HederaClientHelper;
    private maxAutomaticTokenAssociations: number;

    constructor(
        private readonly smartConfigService: SmartConfigService,
        private readonly nodeClientService: ClientService,
        private readonly ipfsResolver: IpfsResolverService,
        private readonly cypherService: CypherService,
        private configService: ConfigService,
        private readonly discordLogger: DiscordLogger,
        @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
        @InjectModel(WalletTransaction.name) private walletTransactiontModel: Model<WalletTransactionDocument>,
        @InjectModel(IDIssuer.name) private issuerModel: Model<IDIssuerDocument>,
        @InjectModel(IDCredential.name) private credentialModel: Model<IDCredentialDocument>,
        private readonly walletsKeyService: WalletsKeyService,
        private readonly identitiesService: IdentitiesService,
        @Inject(forwardRef(() => AgentProfileService))
        private readonly agentProfileService: AgentProfileService,
    ) {
        this.maxAutomaticTokenAssociations = Number(this.configService.get<string>('maxAutomaticTokenAssociations'));
        this.hederaClient = new HederaClientHelper(
            LedgerId.fromString(this.smartConfigService.getEnvironment()),
            this.smartConfigService.getOperator(),
            this.smartConfigService.getMirrorNode()
        );
    }

    async onModuleInit() {}

    async getWallet(
        userId: string
    ): Promise<IVC.Wallet.History> {
        return new Promise(async (resolve, reject) => {
            try {
                // checking if the wallet exists for the given userId and is of type 'user'...
                let wallet: WalletDocument = await this.walletModel.findOne({
                    owner: userId,
                    type: 'user' // Added type filter
                });

                // if the wallet does not exist, then try finding by account.id (fallback)
                if (!wallet) {
                    wallet = await this.walletModel.findOne({
                        'account.id': userId
                    });
                    //await this.discordLogger.warn(`wallet not found for user ${userId}`, 'WalletsService.getWallet');
                }
                if (!wallet) {
                    throw (new Error(`wallet not found for user ${userId}`));
                }

                let agentProfileData: any = {};
                if (wallet.type === 'agent') {
                    if (wallet.account && typeof wallet.account.id === 'string') {
                        try {
                            const agentProfile = await this.agentProfileService.findByAgentAccountId(wallet.account.id);
                            if (agentProfile) {
                                agentProfileData = {
                                    agentName: agentProfile.agentName,
                                    purpose: agentProfile.purpose,
                                };
                            } else {
                                agentProfileData = {
                                    agentName: 'no profile found',
                                    purpose: 'no profile found',
                                };
                            }
                        } catch (error) {
                            this.logger.error(`Error fetching agent profile for account ID ${wallet.account.id} in getWallet: ${error.message}`, error.stack);
                            agentProfileData = {
                                agentName: 'no profile found',
                                purpose: 'no profile found',
                                error: 'Error fetching profile'
                            };
                        }
                    } else {
                         agentProfileData = {
                            agentName: 'no profile found',
                            purpose: 'no profile found',
                            error: 'Agent wallet account ID not found'
                        };
                    }
                }

                // populating the transactions for the wallet...
                await wallet.populate({path: 'transactions'});
                
                // SMART-NODE CALL for balance and nfts (assuming this modifies wallet.account.balance and fetches nfts)
                wallet.account.balance = (await this.nodeClientService.axios.get(
                    `/accounts/restful/${wallet.account.id}/tokens`)).data;
                const nftsData = (await this.nodeClientService.axios.get(
                    `/accounts/restful/${wallet.account.id}/nfts`)).data.nfts;

                let issuers = await this.issuerModel.find({
                    nftID: {$in: wallet.account.balance.tokens.map((token: any) => token.token_id)}
                });

                let credentials: Array<IDCredentialDocument> = await this.credentialModel.find({
                    owner: userId,
                    issuer: {$in: issuers.map(issuer => issuer.issuer)}
                });

                let metadataPromises = nftsData.map(nft => this.ipfsResolver.getMetadata(nft.metadata));
                let metadataResponses = await Promise.all(metadataPromises);
                const processedNfts = [ ...nftsData ]; // Create a mutable copy

                for (let index = 0; index < metadataResponses.length; index++) {
                    const metadata = metadataResponses[index];
                    let credential = credentials.find(cred => cred.serial_number == processedNfts[index].serial_number);
                    processedNfts[index].metadata = metadata;

                    if (!lodash.isUndefined(credential?.iv)) {
                        processedNfts[index].metadata.properties = JSON.parse(await this.cypherService.decrypt(
                            processedNfts[index].metadata.properties.encryptedText,
                            credential.iv
                        ))
                    }
                }

                wallet.account.balance.tokens.forEach((token: any) => {
                    let nftsForToken = processedNfts.filter((nft: any) => nft.token_id == token.token_id);
                    let issuer = issuers.find(iss => iss.nftID == token.token_id)?.issuer; // Add optional chaining for safety

                    nftsForToken = nftsForToken.map(nft => {
                        nft.credential = credentials.find(cred =>
                            cred.issuer == issuer && cred.serial_number == nft.serial_number)
                        return nft;
                    });
                    token['nfts'] = nftsForToken;
                });

                this.logger.log(`Wallet details fetched successfully - userId: ${userId}, accountId: ${wallet.account.id}, tokenCount: ${wallet.account.balance?.tokens?.length || 0}, nftCount: ${processedNfts?.length || 0}, transactionCount: ${wallet.transactions.length}`);

                const walletObjectForId = wallet.toObject(); // Get _id from the main wallet document

                resolve({
                    _id: walletObjectForId._id,
                    owner: wallet.owner, // Added owner field
                    type: wallet.type, // Added type field
                    ...agentProfileData, // agentName, purpose, and optional error
                    ...wallet.account, // Spreads id, balance (now populated with tokens/nfts), etc.
                    transactions: wallet.transactions.filter(transaction =>
                        transaction.from == wallet.account.id ||
                        transaction.to == wallet.account.id
                    )
                });
            } catch (error) {

                if (error.message.includes('wallet not found')) {
                    this.logger.log(`Wallet not found - userId: ${userId}`);

                } else {
                    this.logger.error({
                  
                        userId: userId,
                        error: error.message,
                        method: 'WalletsService.getWallet()',
                        stack: error.stack
                    },'Error fetching wallet details');
                    await this.discordLogger.error(`getWallet error: ${error} for user ${userId}`, error.stack, 'WalletsService.getWallet()');
                }

                reject(error);
            }
        });
    }

    async createWallet(createWalletRequest: IVC.Wallet.Request.Create & { type?: 'user' | 'agent' }): Promise<{ wallet: Wallet, did: any }> {
        return new Promise(async (resolve, reject) => {
            try {
                const type = createWalletRequest.type || 'user';
                // Only one user wallet per owner
                if (type === 'user') {
                    let existing = await this.walletModel.findOne({ owner: createWalletRequest.owner, type: 'user' });
                    if (existing) {
                        throw new Error(`A user wallet already exists for user ${createWalletRequest.owner}`);
                    }
                }
                // Generate account key
                const privateKey = PrivateKey.generate();
                const publicKey = privateKey.publicKey;
                // Create Hedera account using SDK
                const transaction = new AccountCreateTransaction()
                    .setKey(publicKey)
                    .setInitialBalance(0)
                    .setMaxAutomaticTokenAssociations(this.maxAutomaticTokenAssociations)
                    .setReceiverSignatureRequired(false);
                const client = this.hederaClient.getClient();
                // Freeze and sign with generated key
                const frozenTx = await transaction.freezeWith(client);
                const signTx = await frozenTx.sign(privateKey);
                const submitTx = await signTx.execute(client);
                const receipt = await submitTx.getReceipt(client);
                if (receipt.status == Status.Success) {
                    // Save private key in wallets-key module
                    await this.walletsKeyService.saveKey({
                        owner: createWalletRequest.owner,
                        type,
                        accountId: receipt.accountId.toString(),
                        privateKey: privateKey.toString()
                    });
                    const walletDocument = new this.walletModel({
                        owner: createWalletRequest.owner,
                        type,
                        account:  {
                            id: receipt.accountId.toString(),
                            balance: null
                        },
                        transactions: []
                    });
                    await walletDocument.save();
                    // Create DID for this user/agent
                    let didResponse;
                    if (type === 'agent') {
                        didResponse = await this.identitiesService.createDID(receipt.accountId.toString());
                    } else {
                        didResponse = await this.identitiesService.createDID(createWalletRequest.owner);
                    }
                    this.logger.log(`Wallet created successfully - userId: ${createWalletRequest.owner}, type: ${type}, accountId: ${receipt.accountId.toString()}`);
                    resolve({
                        wallet: <Wallet>walletDocument.toJSON(),
                        did: didResponse
                    });
                } else {
                    throw new Error(`transaction failed with status ${receipt.status}`);
                }
            } catch (error) {
                this.logger.error({
                    error: error.message,
                    method: 'WalletsService.createWallet()',
                    owner: createWalletRequest.owner,
                    stack: error.stack
                }, 'Error creating wallet');
                await this.discordLogger.error(`createWallet error: ${error}`, 'WalletsService.createWallet()');
                reject(error);
            }
        });
    }

    async associateToken(
        associateWalletRequest: IVC.Wallet.Request.Associate
    ): Promise<ISmartNode.ISmartTransaction.IDetails> {
        return new Promise(async (resolve, reject) => {
            try {

                // SMART-NODE CALL: associating a token to the wallet...
                let response = await this.nodeClientService.axios.post(
                    `/hts/associate/${associateWalletRequest.tokenId}/${associateWalletRequest.walletId}`
                );
                let transaction = Transaction.fromBytes(new Uint8Array(Buffer.from(response.data)));

                // signing the transaction and submitting it to the network...
                const client = this.hederaClient.getClient();
                const signTx = await transaction.sign(
                    PrivateKey.fromString(this.smartConfigService.getOperator().privateKey)
                );

                const submitTx = await signTx.execute(client);
                const receipt = await submitTx.getReceipt(client);

                if (receipt.status == Status.Success) {
                   
                    this.logger.log(`Token associated successfully - tokenId: ${associateWalletRequest.tokenId}, walletId: ${associateWalletRequest.walletId}`);
                    resolve({
                        status: receipt.status.toString(),
                        transactionId: submitTx.transactionId.toString()
                    });
                } else {
                    throw (new Error(`transaction failed with status ${receipt.status}`));
                }
            } catch (error) {
                this.logger.error({
                 
                    tokenId: associateWalletRequest.tokenId,
                    walletId: associateWalletRequest.walletId,
                    error: error.message,
                    method: 'WalletsService.associateToken()'
                }, 'Error associating token');
                reject(error);
            }
        });
    }

    async dissociateToken(
        associateWalletRequest: IVC.Wallet.Request.Associate
    ): Promise<ISmartNode.ISmartTransaction.IDetails> {
        return new Promise(async (resolve, reject) => {
            try {

                // SMART-NODE CALL: dissociating a token to the wallet...
                let response = await this.nodeClientService.axios.post(
                    `/hts/dissociate/${associateWalletRequest.tokenId}/${associateWalletRequest.walletId}`
                );
                let transaction = Transaction.fromBytes(new Uint8Array(Buffer.from(response.data)));

                // signing the transaction and submitting it to the network...
                const client = this.hederaClient.getClient();
                const signTx = await transaction.sign(
                    PrivateKey.fromString(this.smartConfigService.getOperator().privateKey)
                );

                const submitTx = await signTx.execute(client);
                const receipt = await submitTx.getReceipt(client);

                if (receipt.status == Status.Success) {
                    this.logger.log(`Token dissociation successful - tokenId: ${associateWalletRequest.tokenId}, walletId: ${associateWalletRequest.walletId}, transactionId: ${submitTx.transactionId.toString()}`);
                  
                    resolve({
                        status: receipt.status.toString(),
                        transactionId: submitTx.transactionId.toString()
                    });
                } else {

                    throw (new Error(`transaction failed with status ${receipt.status}`));
                }
            } catch (error) {
                this.logger.error({
                    tokenId: associateWalletRequest.tokenId,
                    walletId: associateWalletRequest.walletId,
                    error: error.message,
                    method: 'WalletsService.dissociateToken()'
                }, 'Error dissociating token');
                reject(error);
            }
        });
    }

    async withdrawToken(
        withdraw: I_IVC.IWallet.IRequest.IWithdraw
    ): Promise<I_IVC.IWallet.IResponse.IWithdraw> {
        return new Promise(async (resolve, reject) => {
            try {
                // checking if the wallet exists for the given userId...
                let wallet: IVC.Wallet.History = await this.getWallet(withdraw.userId);

                // if the wallet does not exist, then throw an error...
                if (!wallet) {
                    throw (new Error(`wallet not found for user ${withdraw.userId}`));
                }

                // checking if the wallet has sufficient funds...
                let tokenBalance = wallet.balance.tokens.find((token: any) => token.token_id == withdraw.token.id);
                if (new Decimal(tokenBalance.balance).lessThan(withdraw.amount)) {
                    throw (new Error(`insufficient funds on your wallet.`));
                }

                // SMART-NODE CALL: moving funds from user's wallet into a destination wallet...
                let payload: IHedera.ILedger.IHTS.ITransferFungibleToken = {
                    token_id: withdraw.token.id,
                    sender: wallet.id,
                    receiver: withdraw.wallet,
                    amount: withdraw.amount,
                    decimals: withdraw.token.decimals,
                    memo: 'withdraw funds from wallet'
                }

                let response = await this.nodeClientService.axios.post(
                    `/hts/transfer/token`,
                    payload
                );
                let transaction = Transaction.fromBytes(new Uint8Array(Buffer.from(response.data)));

                // signing the transaction and submitting it to the network...
                const client = this.hederaClient.getClient();
                const signTx = await transaction.sign(
                    PrivateKey.fromString(this.smartConfigService.getOperator().privateKey)
                );

                const submitTx = await signTx.execute(client);
                const receipt = await submitTx.getReceipt(client);

                if (receipt.status == Status.Success) {
                    this.logger.log(`Token withdrawal successful - userId: ${withdraw.userId}, tokenId: ${withdraw.token.id}, amount: ${withdraw.amount}, transactionId: ${submitTx.transactionId.toString()}`);
                    let withdrawResponse: I_IVC.IWallet.IResponse.IWithdraw = {
                        amount: withdraw.amount,
                        date: moment().unix(),
                        transactionId: submitTx.transactionId.toString().toString(),
                        status: I_IVC.IWallet.IResponse.IWthdrawStatus.COMPLETED
                    };
                    this.logger.log(`Token withdrawal completed - userId: ${withdraw.userId}, tokenId: ${withdraw.token.id}, amount: ${withdraw.amount}`);
                    resolve(withdrawResponse);
                } else {
                    throw (new Error(`transaction failed with status ${receipt.status}`));
                }
            } catch (error) {
                this.logger.error({
                    userId: withdraw.userId,
                    tokenId: withdraw.token?.id,
                    amount: withdraw.amount,
                    error: error.message,
                    method: 'WalletsService.withdrawToken()'
                }, 'Error withdrawing token');
                reject(error);
            }
        });
    }

    async deleteWallet(
        userId: string,
        transferAccountId: AccountId
    ): Promise<ISmartNode.ISmartTransaction.IDetails> {
        return new Promise(async (resolve, reject) => {
            try {
                // checking if the wallet exists for the given userId...
                let walletDocument: WalletDocument = await this.walletModel.findOne({
                    owner: userId
                });

                // if the wallet does not exist, then throw an error...
                if (!walletDocument) {
                    throw (new Error(`owner ${userId} not found`));
                }

                // SMART-NODE CALL: creating the wallet...
                let response = await this.nodeClientService.axios.delete(`/accounts/${walletDocument.account.id}`, {
                    data: {
                        transferAccountId: transferAccountId.toString()
                    }
                });
                let transaction = Transaction.fromBytes(new Uint8Array(Buffer.from(response.data)));

                // signing the transaction and submitting it to the network...
                const client = this.hederaClient.getClient();
                const signTx = await transaction.sign(
                    PrivateKey.fromString(this.smartConfigService.getOperator().privateKey)
                );

                const submitTx = await signTx.execute(client);
                const receipt = await submitTx.getReceipt(client);

                if (receipt.status == Status.Success) {
                    this.logger.log(`Wallet deletion successful - userId: ${userId}, transactionId: ${submitTx.transactionId.toString()}`);
                    await walletDocument.deleteOne();
                  
                    resolve({
                        status: receipt.status.toString(),
                        transactionId: submitTx.transactionId.toString()
                    });
                } else {
                    throw (new Error(`transaction failed with status ${receipt.status}`));
                }
            } catch (error) {
                this.logger.error({
                    userId: userId,
                    transferAccountId: transferAccountId.toString(),
                    error: error.message,
                    method: 'WalletsService.deleteWallet()'
                }, 'Error deleting wallet',);
                reject(error);
            }
        });
    }

    async getToken(
        userId: string

    ): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                // checking if the wallet exists for the given userId...
                let wallet: WalletDocument = await this.walletModel.findOne({
                    owner: userId
                });

                // if the wallet does not exist, then throw an error...
                if (!wallet) {
                    wallet = await this.walletModel.findOne({
                        'account.id': userId
                    });
                   
                }
                if (!wallet) {
                    throw (new Error(`wallet not found for user ${userId}`));
                }

                // Use wallet.id for the API call
                const walletId = wallet.account.id; // Get wallet ID from the wallet document

                // SMART-NODE CALL: fetching token relationships for the specified wallet...
                const response = await this.nodeClientService.axios.get(`/accounts/restful/${walletId}/tokens`, {
                });
                this.logger.log(`Successfully retrieved wallet tokens - userId: ${userId}, walletId: ${walletId}, tokenCount: ${response.data?.tokens?.length || 0}`);
                // resolving the response data...
                resolve(response.data);
            } catch (error) {
                this.logger.error({
                    userId: userId,
                    error: error.message,
                    method: 'WalletsService.getToken()',
                    stack: error.stack
                }, 'Error fetching wallet tokens');
                await this.discordLogger.error(`getToken error: ${error}`, 'WalletsService.getToken()');
                reject(error);
            }
        });
    }

    async getNftInfo(
        tokenId: string,
        serialNumber: string
    ): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                // SMART-NODE CALL: fetching NFT information...
                const response = await this.nodeClientService.axios.get(
                    `/hts/restful/tokens/${tokenId}/nfts/${serialNumber}`
                );

                this.logger.log(`Successfully retrieved NFT information - tokenId: ${tokenId}, serialNumber: ${serialNumber}`);


                resolve(response.data);
            } catch (error) {
                this.logger.error({
                    tokenId: tokenId,
                    serialNumber: serialNumber,
                    error: error.message,
                    method: 'WalletsService.getNftInfo()',
                    stack: error.stack
                }, 'Error fetching NFT information');
                await this.discordLogger.error(`getNftInfo error: ${error} for serialNumber ${serialNumber}`, 'WalletsService.getNftInfo()');
                reject(error);
            }
        });
    }

    async findOne(filter: any): Promise<WalletDocument | null> {
        return this.walletModel.findOne(filter);
    }
    async findAllAgents(filter: any): Promise<any[]> { 
      const wallets = await this.walletModel.find(filter).exec();
      const results = [];

      for (const wallet of wallets) {
        let agentProfileData: any = {};
        if (wallet.type === 'agent' && wallet.account && typeof wallet.account.id === 'string') {
          try {
            const agentProfile = await this.agentProfileService.findByAgentAccountId(wallet.account.id);
            if (agentProfile) {
              agentProfileData = {
                agentName: agentProfile.agentName,
                purpose: agentProfile.purpose,
              };
            } else {
              agentProfileData = {
                agentName: 'no profile found',
                purpose: 'no profile found',
              };
            }
          } catch (error) {
            this.logger.error(`Error fetching agent profile for account ID ${wallet.account.id} in findAllAgents: ${error.message}`, error.stack);
            agentProfileData = {
              agentName: 'no profile found',
              purpose: 'no profile found',
              error: 'Error fetching profile'
            };
          }
        } else if (wallet.type === 'agent') {
            agentProfileData = {
                agentName: 'no profile found',
                purpose: 'no profile found',
                error: 'Agent wallet account ID not found or invalid'
            };
        }
        const walletObj = wallet.toObject();
        const { _id, ...restOfWallet } = walletObj;
        results.push({ 
            _id, 
            ...agentProfileData, // agentName, purpose, and optional error
            ...restOfWallet 
        });
      }
      return results;
    }

    async findByAccountId(accountId: string): Promise<WalletDocument | null> {
        return this.walletModel.findOne({ 'account.id': accountId });
    }

    async checkWallets(userIdOrAccountId: string): Promise<boolean> {
        // Check by owner
        let wallet = await this.walletModel.findOne({ owner: userIdOrAccountId });
        if (wallet) return true;
        // Check by account.id
        wallet = await this.walletModel.findOne({ 'account.id': userIdOrAccountId });
        return !!wallet;
    }
}
