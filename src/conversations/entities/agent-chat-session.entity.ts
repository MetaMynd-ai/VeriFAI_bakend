import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AgentChatSessionDocument = AgentChatSession & Document;

@Schema({ timestamps: true })
export class AgentChatSession {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  agent1AccountId: string;

  @Prop({ required: true })
  agent2AccountId: string;

  @Prop({ required: true })
  userDid: string;

  @Prop({ default: 'active', enum: ['active', 'ended'] })
  status: 'active' | 'ended';

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  endedAt?: Date;

  @Prop({ default: 0 })
  messageCount: number;

  @Prop({ default: false })
  transcriptSubmitted: boolean;

  @Prop({ default: 'agent1', enum: ['agent1', 'agent2'] })
  preferredTopicAgent: 'agent1' | 'agent2';

  @Prop({ type: Object })
  metadata?: {
    agent1Profile?: any;
    agent2Profile?: any;
    sessionTitle?: string;
    lastActivity?: Date;
  };
}

export const AgentChatSessionSchema = SchemaFactory.createForClass(AgentChatSession);