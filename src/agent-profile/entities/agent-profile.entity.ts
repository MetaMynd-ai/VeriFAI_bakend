import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { AgentCapability } from './agent-capability.enum';

@Schema({ timestamps: true })
export class AgentProfile extends Document {
  @ApiProperty({ description: 'Agent Hedera account ID' })
  @Prop({ required: true })
  agentAccountId: string;
  @ApiProperty({ description: 'Agent name' })
  @Prop({ required: true })
  agentName: string;
  @ApiProperty({ description: 'Agent DID (unique identifier)' })
  @Prop({ required: true, unique: true })
  agentDid: string;

  @ApiProperty({ description: 'Agent owner DID' })
  @Prop({ required: true })
  agentOwnerDID: string;

  @ApiProperty({ description: 'Agent description' })
  @Prop({ required: true })
  agentDescription: string;
  @ApiProperty({ description: 'Purpose of the agent' })
  @Prop({ required: true })
  purpose: string;
  @ApiProperty({ description: 'Agent URL (endpoint)' })
  @Prop({ required: true })
  url: string;

  @ApiProperty({
    description: 'Agent capabilities (array of AgentCapability enum keys)',
    isArray: true,
    enum: Object.keys(AgentCapability).filter(k => isNaN(Number(k)))
  })
  @Prop({
    type: [String],
    required: true,
    enum: Object.keys(AgentCapability).filter(k => isNaN(Number(k)))
  })
  capability: (keyof typeof AgentCapability)[];

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
