import { PartialType } from '@nestjs/swagger';
import { CreateAgentProfileDto } from './create-agent-profile.dto';

export class UpdateAgentProfileDto extends PartialType(CreateAgentProfileDto) {}
