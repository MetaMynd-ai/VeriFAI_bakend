import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, ConversationDocument } from './entities/conversation.entity';
import { ConversationMessage, ConversationMessageDocument } from './entities/conversation-message.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(ConversationMessage.name) private messageModel: Model<ConversationMessageDocument>,
  ) {}

  async createConversation(
    participants: string[],
    communicationTopicId: string,
    ownerDid?: string,
    metadata?: any
  ): Promise<Conversation> {
    const conversation = new this.conversationModel({
      id: uuidv4(),
      participants,
      communicationTopicId,
      ownerDid,
      metadata,
      startTime: new Date(),
      isActive: true,
    });

    return conversation.save();
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.conversationModel.findOne({ id }).exec();
  }

  async getConversationWithMessages(id: string): Promise<Conversation | null> {
    const conversation = await this.conversationModel.findOne({ id }).exec();
    if (!conversation) return null;

    const messages = await this.messageModel.find({ conversationId: id }).sort({ timestamp: 1 }).exec();
    return { ...conversation.toObject(), messages };
  }

  async addMessage(
    conversationId: string,
    fromAgentId: string,
    toAgentId: string,
    message: string,
    isAIGenerated = false,
    metadata?: any
  ): Promise<ConversationMessage> {
    const conversationMessage = new this.messageModel({
      id: uuidv4(),
      conversationId,
      fromAgentId,
      toAgentId,
      message,
      isAIGenerated,
      metadata,
      timestamp: new Date(),
    });

    await conversationMessage.save();

    // Update conversation's last activity
    await this.conversationModel.updateOne(
      { id: conversationId },
      { $set: { 'metadata.lastActivity': new Date() } }
    );

    return conversationMessage;
  }

  async endConversation(id: string): Promise<boolean> {
    const result = await this.conversationModel.updateOne(
      { id },
      { 
        $set: { 
          isActive: false, 
          endTime: new Date(),
          'metadata.blockchainSubmitted': false
        } 
      }
    );

    return result.modifiedCount > 0;
  }

  async markTranscriptSubmitted(id: string, hcsTransactionId?: string): Promise<boolean> {
    const updateData: any = {
      'metadata.blockchainSubmitted': true
    };

    if (hcsTransactionId) {
      updateData['metadata.hcsTransactionId'] = hcsTransactionId;
    }

    const result = await this.conversationModel.updateOne(
      { id },
      { $set: updateData }
    );

    return result.modifiedCount > 0;
  }

  async getUserConversations(ownerDid: string, isActive?: boolean): Promise<Conversation[]> {
    const filter: any = { ownerDid };
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    return this.conversationModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
    return this.messageModel.find({ conversationId }).sort({ timestamp: 1 }).exec();
  }
}