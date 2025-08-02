import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import {
  AgentCapability,
  AgentStatus,
  AgentVcIssueStatus,
  AgentType,
  AgentCategory
} from './agent.enum';

@Schema({ timestamps: true })
export class AgentProfile extends Document {
  // 🔹 High-level Classification
  @ApiProperty({ description: 'Agent Status', enum: AgentStatus })
  @Prop({ required: true, enum: AgentStatus, default: AgentStatus.PENDING_DID })
  status: AgentStatus;

  @ApiProperty({ description: 'VC Issue Status', enum: AgentVcIssueStatus, default: AgentVcIssueStatus.PENDING })
  @Prop({ required: true, enum: AgentVcIssueStatus, default: AgentVcIssueStatus.PENDING })
  vcIssueStatus: AgentVcIssueStatus;

  @ApiProperty({ description: 'Agent Type', enum: AgentType })
  @Prop({ required: true, enum: AgentType })
  agentType: AgentType;

  @ApiProperty({ description: 'Agent Category', enum: AgentCategory })
  @Prop({ required: true, enum: AgentCategory })
  agentCategory: AgentCategory;

  // 🔹 Identity
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

  // 🔹 Description & Function
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
    description: 'Agent capabilities',
    isArray: true,
    enum: AgentCapability
  })
  @Prop({
    type: [String],
    required: true,
    enum: Object.values(AgentCapability)
  })
  capability: AgentCapability[];

  // 🔹 Messaging topics
  @ApiProperty({ description: 'Inbound topic ID' })
  @Prop({ required: true })
  inboundTopicId: string;

  @ApiProperty({ description: 'Outbound topic ID' })
  @Prop({ required: true })
  outboundTopicId: string;

  @ApiProperty({ description: 'Communication topic ID' })
  @Prop({ required: true })
  communicationTopicId: string;

  @ApiProperty({ description: 'Registry topic sequence' })
  @Prop({ required: false })
  registryTopicSeq?: string;
}

export const AgentProfileSchema = SchemaFactory.createForClass(AgentProfile);
export type AgentProfileDocument = AgentProfile & Document;
export const AgentProfileModel = AgentProfileSchema;
AgentProfileSchema.index({ agentDid: 1 }, { unique: true });
AgentProfileSchema.index({ agentAccountId: 1 }, { unique: true });
AgentProfileSchema.index({ agentOwnerDID: 1 });
AgentProfileSchema.index({ agentType: 1 });
AgentProfileSchema.index({ agentCategory: 1 });
AgentProfileSchema.index({ capability: 1 });