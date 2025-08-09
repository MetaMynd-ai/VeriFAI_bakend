import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationMessageDocument = ConversationMessage & Document;

@Schema({ timestamps: true })
export class ConversationMessage {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  conversationId: string;

  @Prop({ required: true })
  fromAgentId: string;

  @Prop({ required: true })
  toAgentId: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 'text' })
  messageType: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ default: false })
  isAIGenerated: boolean;

  @Prop({ type: Object })
  metadata?: {
    aiModel?: string;
    processingTime?: number;
    error?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

export const ConversationMessageSchema = SchemaFactory.createForClass(ConversationMessage);