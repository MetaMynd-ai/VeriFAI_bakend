import { ApiProperty } from '@nestjs/swagger';
import {
  AgentCapability,
  AgentStatus,
  AgentVcIssueStatus,
  AgentType,
  AgentCategory
} from '../entities/agent.enum';

export class CreateAgentProfileDto {
  // High-level Classification
  @ApiProperty({ description: 'Agent Status', enum: AgentStatus, default: AgentStatus.PENDING_DID })
  status: AgentStatus;

  @ApiProperty({ description: 'VC Issue Status', enum: AgentVcIssueStatus, default: AgentVcIssueStatus.PENDING })
  vcIssueStatus: AgentVcIssueStatus;

  @ApiProperty({ description: 'Agent Type', enum: AgentType })
  agentType: AgentType;

  @ApiProperty({ description: 'Agent Category', enum: AgentCategory })
  agentCategory: AgentCategory;

  @ApiProperty({ description: 'Agent name' })
  agentName: string;

  // Description & Function
  @ApiProperty({ description: 'Agent description' })
  agentDescription: string;

  @ApiProperty({ description: 'Purpose of the agent' })
  purpose: string;

  @ApiProperty({ description: 'Agent URL (endpoint)' })
  url: string;

  @ApiProperty({
    description: 'Agent capabilities',
    isArray: true,
    enum: AgentCapability
  })
  capability: AgentCapability[];

  @ApiProperty({ description: 'Registry topic sequence', required: false, default: null })
  registryTopicSeq: string | null = null;


}
