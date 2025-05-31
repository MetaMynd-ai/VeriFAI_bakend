import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { AgentProfileService } from './agent-profile.service';
import { CreateAgentProfileDto } from './dto/create-agent-profile.dto';
import { AgentProfile } from './entities/agent-profile.entity';

@ApiTags('agent-profile')
@Controller('agent-profile')
export class AgentProfileController {
  constructor(private readonly agentProfileService: AgentProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent profile' })
  @ApiBody({ type: CreateAgentProfileDto })
  @ApiOkResponse({ type: AgentProfile })
  async create(@Body() createAgentProfileDto: CreateAgentProfileDto): Promise<AgentProfile> {
    return this.agentProfileService.create(createAgentProfileDto);
  }

  @Get(':agentId')
  @ApiOperation({ summary: 'Get agent profile by agentId' })
  @ApiOkResponse({ type: AgentProfile })
  async findByAgentId(@Param('agentId') agentId: string): Promise<AgentProfile | null> {
    return this.agentProfileService.findByAgentId(agentId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agent profiles' })
  @ApiOkResponse({ type: [AgentProfile] })
  async findAll(): Promise<AgentProfile[]> {
    return this.agentProfileService.findAll();
  }
}
