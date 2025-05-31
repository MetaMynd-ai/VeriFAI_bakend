import { AgentCapability } from '../entities/agent-capability.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgentProfileDto {
  @ApiProperty({ description: 'Agent ID (external identifier, e.g. UUID or short code)' })
  agentId: string;

  @ApiProperty({ description: 'Agent description' })
  agentDescription: string;

  @ApiProperty({ description: 'Agent URL (endpoint)' })
  url: string;

  @ApiProperty({
    description: 'Agent capabilities (array of AgentCapability enum keys)',
    isArray: true,
    enum: Object.keys(AgentCapability).filter(k => isNaN(Number(k)))
  })
  capability: (keyof typeof AgentCapability)[];
}
