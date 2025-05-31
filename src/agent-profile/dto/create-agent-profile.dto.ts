import { ApiProperty } from '@nestjs/swagger';
import { AgentCapability } from '../entities/agent-capability.enum';

export class CreateAgentProfileDto {
  @ApiProperty({ description: 'Agent unique identifier (DID or UUID)' })
  agentId: string;

  @ApiProperty({ description: 'Agent Hedera account ID' })
  hederaAccountId: string;

  @ApiProperty({ description: 'Agent URL (endpoint)' })
  url: string;

  @ApiProperty({
    description: 'Agent capabilities (array of AgentCapability enum values)',
    isArray: true,
    enum: AgentCapability
  })
  capability: AgentCapability[];

  @ApiProperty({ description: 'Inbound topic ID' })
  inboundTopicId: string;

  @ApiProperty({ description: 'Outbound topic ID' })
  outboundTopicId: string;

  @ApiProperty({ description: 'Communication topic ID' })
  communicationTopicId: string;
}
