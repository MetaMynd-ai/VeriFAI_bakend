import { AgentCapability } from '../entities/agent-capability.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgentProfileDto {
  @ApiProperty({ description: 'Agent name' })
  agentName: string;
  @ApiProperty({ description: 'Agent description' })
  agentDescription: string;
  @ApiProperty({ description: 'Purpose of the agent' })
  purpose: string;
  @ApiProperty({ description: 'Agent URL (endpoint)' })
  url: string;

  @ApiProperty({
    description: 'Agent capabilities (array of AgentCapability enum values)',
    isArray: true,
    enum: AgentCapability
  })
  capability: AgentCapability[];
}
