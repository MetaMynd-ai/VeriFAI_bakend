import {Injectable, Logger} from '@nestjs/common';
import {Client, TokenUnfreezeTransaction, PrivateKey, LedgerId, Transaction, Status} from '@hashgraph/sdk';
import {ClientService} from '@hsuite/client';
import {SmartConfigService} from '@hsuite/smart-config';
import {ConfigService} from '@nestjs/config';
import {WalletsService} from 'src/wallets/wallets.service';
import {HttpService} from '@nestjs/axios';
import {IHedera} from '@hsuite/types';
import {HederaClientHelper} from '@hsuite/helpers';
import {AxiosError} from 'axios';
import {PinoLogger, InjectPinoLogger} from 'nestjs-pino';

@Injectable()
export class HtsService {

    @InjectPinoLogger(HtsService.name)
    private readonly logger: PinoLogger

        
        
    private environment: string;
    private node: IHedera.IOperator;
    private hederaClient: HederaClientHelper;

    constructor(
        private readonly nodeClientService: ClientService,
        private smartConfigService: SmartConfigService,
        private configService: ConfigService

    ) {
        this.environment = this.configService.get<string>('environment');
        this.node = this.configService.get<IHedera.IOperator>(`${this.environment}.node`);
        this.hederaClient = new HederaClientHelper(
            LedgerId.fromString(this.smartConfigService.getEnvironment()),
            this.smartConfigService.getOperator(),
            this.smartConfigService.getMirrorNode()
        );
    }


    async unfreezeAccounts(accountIds: string[]): Promise<{accountId: string; status: 'success' | 'failed'; error?: string}[]> {
        const results: {accountId: string; status: 'success' | 'failed'; error?: string}[] = [];
        const tokenId = this.configService.get<string>(`${this.environment}.tokenId`);
        for (const accountId of accountIds) {
            try {
                // SMART-NODE CALL: asking the smart-nodes to unfreeze the token for this account
                let sendBytes = (await this.nodeClientService.axios.post(
                    `/hts/unfreeze/${tokenId}`, {
                    walletId: accountId,
                })).data;

                // smart-nodes will return a bytes transaction, ready to be signed and submitted to the network
                let transaction = Transaction.fromBytes(new Uint8Array(Buffer.from(sendBytes)));
                const client = this.hederaClient.getClient();

                // Signing the transaction
                const signTx = await transaction.sign(PrivateKey.fromString(this.node.privateKey));

                // Submitting the transaction
                const submitTx = await signTx.execute(client);
                const receipt = await submitTx.getReceipt(client);



                // Add successful result
                results.push({accountId, status: receipt.status === Status.Success ? 'success' : 'failed'});

                this.logger.info({
                    accountId: accountId,
                    tokenId: tokenId
                }, 'Token unfroze successfully');
            } catch (error) {
                this.logger.error({
                    accountId: accountId,
                    tokenId: tokenId,
                    error: error?.message,
                    method: 'HtsService.unfreezeAccounts()'
                }, 'Error unfreezing token'); results.push({
                    accountId,
                    status: 'failed',
                    error: error.message,
                });
            }
        }
        this.logger.info({
            totalAccounts: accountIds.length,
        }, 'Unfreeze accounts process completed');
        return results;
    }

    async wipeNft(
        accountId: string,
        serial_number: string
    ): Promise<{accountId: string; status: 'success' | 'failed'; error?: string}> {
        return new Promise(async (resolve, reject) => {
            try {
                const tokenId = this.configService.get<string>(`${this.environment}.tokenId`);

                // SMART-NODE CALL: asking the smart-nodes to send the nft...
                let sendBytes = (await this.nodeClientService.axios.post(
                    `/hts/wipe/nft`, {
                    token_id: tokenId,
                    serial_number: serial_number,
                    account_id: accountId
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
                    this.logger.info({
                        accountId: accountId,
                        serialNumber: serial_number,
                        tokenId: tokenId
                    }, 'NFT wiped successfully',);
                    resolve({accountId, status: 'success'});

                } else {
                    this.logger.error({
                        accountId: accountId,
                        serialNumber: serial_number,
                        tokenId: tokenId
                    },  'NFT wipe transaction failed');
                    reject('Transaction failed');
                }
            } catch (error) {
                this.logger.error({
                    accountId: accountId,
                    serialNumber: serial_number,
                    error: error?.message,
                    method: 'HtsService.wipeNft()'
                }, 'Error wiping NFT');
                if (error instanceof AxiosError) {
                    reject(new Error(error.response?.data?.message));
                } else {
                    reject(new Error(error.message));
                }
            }
        });
    }
}
