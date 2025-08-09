
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ConversationMessage } from './conversation-message.entity';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
    @Prop({ required: true, unique: true })
    id: string;

    @Prop({ required: true })
    communicationTopicId: string;

    @Prop({ type: [String], required: true })
    participants: string[];

    @Prop({ default: Date.now })
    startTime: Date;

    @Prop()
    endTime?: Date;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    ownerDid?: string;

    @Prop({ type: [Object], default: [] })
    messages?: ConversationMessage[];

    @Prop({ type: Object })
    metadata?: {
      title?: string;
      communicationTopicId?: string;
      description?: string;
      blockchainSubmitted?: boolean;
      hcsTransactionId?: string;
    };

    createdAt: Date;
    updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
