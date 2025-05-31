import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { AgentCapability } from './agent-capability.enum';

@Schema({ timestamps: true })
export class AgentProfile extends Document {
  @ApiProperty({ description: 'Agent unique identifier (DID or UUID)' })
  @Prop({ required: true, unique: true })
  agentId: string;

  @ApiProperty({ description: 'Agent Hedera account ID' })
  @Prop({ required: true })
  hederaAccountId: string;

  @ApiProperty({ description: 'Agent URL (endpoint)' })
  @Prop({ required: true })
  url: string;

  @ApiProperty({
    description: 'Agent capabilities (array of AgentCapability enum values)',
    isArray: true,
    enum: AgentCapability
  })
  @Prop({
    type: [Number],
    required: true,
    enum: AgentCapability
  })
  capability: AgentCapability[];

  @ApiProperty({ description: 'Inbound topic ID' })
  @Prop({ required: true })
  inboundTopicId: string;

  @ApiProperty({ description: 'Outbound topic ID' })
  @Prop({ required: true })
  outboundTopicId: string;

  @ApiProperty({ description: 'Communication topic ID' })
  @Prop({ required: true })
  communicationTopicId: string;
}

export const AgentProfileSchema = SchemaFactory.createForClass(AgentProfile);
