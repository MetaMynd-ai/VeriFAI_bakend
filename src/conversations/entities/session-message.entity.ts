import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SessionMessageDocument = SessionMessage & Document;

@Schema({ timestamps: true })
export class SessionMessage {
  @Prop({ required: true })
  sessionId: string;

  @Prop({ required: true })
  fromAgentId: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ type: Object })
  metadata?: {
    aiModel?: string;
    processingTime?: number;
    tokensUsed?: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

export const SessionMessageSchema = SchemaFactory.createForClass(SessionMessage);