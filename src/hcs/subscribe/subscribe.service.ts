import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, TopicMessageQuery } from '@hashgraph/sdk';
import { customTestnetConfig } from '../../../config/settings/network/testnet.config';

@Injectable()
export class SubscribeService  {
    private readonly logger = new Logger(SubscribeService.name);
    private environment: string;
    private node: any;

    constructor(private configService: ConfigService) {
        this.environment = this.configService.get<string>('environment');

    }

    private createHederaClient(): Client {
        const client = Client.forTestnet();
        const mirrorGrpcUrl = this.configService.get<string>('DEV_MIRROR_GRPC_URL');
        if (mirrorGrpcUrl) {
            client.setMirrorNetwork('hcs.testnet.mirrornode.hedera.com:5600');

        }
        const operatorAccountId = this.configService.get<string>('DEV_NODE_ID');
         const operatorPrivateKey = this.configService.get<string>('DEV_NODE_PRIVATE_KEY');
       // const operatorAccountId = "0.0.6096495"
        //const operatorPrivateKey = "302e020100300506032b657004220420a1d6243b3c60965072cfc6a447e65998a93db07354a003275a1706c93880da90";

        client.setOperator(operatorAccountId, operatorPrivateKey);
        return client;
    }

    async subscribeToTopic(topicId: string, onMessage: (message: any) => void): Promise<void> {
        const client = this.createHederaClient();
        // Subscribe to the Hedera topic using TopicMessageQuery
        new TopicMessageQuery()
            .setMaxAttempts(1) // Set the maximum number of attempts to receive messages
            .setTopicId(topicId)
            .setErrorHandler((message, error) => {
                this.logger.error(`Error receiving message from topic ${topicId}`, error);
                // Handle the error, e.g., log it or retry
                if (message) {
                    this.logger.error(`Received message with error: ${message}`);
                }
            })
            .setCompletionHandler(() => {
                this.logger.log(`Completed receiving messages from topic ${topicId}`);
            })
            .setGrpcDeadline( 1  )    // Ensure that the client is not already subscribed to the topic
            .setMaxBackoff(8000) // Set the maximum backoff time in milliseconds
            .subscribe( 
                client,
                (message) => {
                    // Call the callback with the message
                    onMessage(message);
                },
                (error) => {
                    this.logger.error('Error receiving topic message', Buffer.from(error.contents).toString('utf8'));
                }
                
            )
    }
}