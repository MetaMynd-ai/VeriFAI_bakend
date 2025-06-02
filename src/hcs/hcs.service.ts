import { Injectable } from '@nestjs/common';
import { TopicCreateTransaction, Client, TopicMessageSubmitTransaction } from '@hashgraph/sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HcsService {
  constructor(private readonly configService: ConfigService) {}

  async createHcsTopic(memo?: string): Promise<{ topicId: string}> {
    // Setup Hedera client
    const client = Client.forTestnet();
    client.setOperator(
      this.configService.get<string>('DEV_NODE_ID'),
      this.configService.get<string>('DEV_NODE_PRIVATE_KEY')
    );

    const transaction = new TopicCreateTransaction();
    if (memo) {
      transaction.setTopicMemo(memo);
    }
    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    return { topicId: receipt.topicId.toString() };
  }
  
  async writeMessageToTopic(topicId: string, message: string, submitKey?: any): Promise<{ status: string, topicId: string, topicSequenceNumber?: string }> {
    let resolvedTopicId = topicId;
    if (topicId === 'register') {
      resolvedTopicId = this.configService.get<string>('DEV_AGENT_REGISTRY_TOPIC');
    }
    const client = Client.forTestnet();
    client.setOperator(
      this.configService.get<string>('DEV_NODE_ID'),
      this.configService.get<string>('DEV_NODE_PRIVATE_KEY')
    );
    let tx = new TopicMessageSubmitTransaction()
      .setTopicId(resolvedTopicId)
      .setMessage(message);
    if (submitKey) {
      tx = await tx.freezeWith(client);
      tx = await tx.sign(submitKey);
    }
    const submitTx = await tx.execute(client);
    const receipt = await submitTx.getReceipt(client);
    return { status: receipt.status.toString(), topicId: resolvedTopicId, topicSequenceNumber: receipt.topicSequenceNumber?.toString() };
  }
}
