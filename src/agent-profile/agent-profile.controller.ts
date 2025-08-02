import { Body, Controller, Get, Param, Post, Query, BadRequestException, Req } from '@nestjs/common';
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
  async create(
    @Body() createAgentProfileDto: CreateAgentProfileDto,
    @Query('agentAccountId') agentAccountId: string
  ): Promise<AgentProfile> {
    try {
      return await this.agentProfileService.create(createAgentProfileDto, agentAccountId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('new-agent-account')
  @ApiOperation({ summary: 'Create a new agent profile with a new agent account' })
  @ApiBody({ type: CreateAgentProfileDto })
  @ApiOkResponse({ type: AgentProfile })
  async createWithNewAgentAccount(
    @Body() createAgentProfileDto: CreateAgentProfileDto,
    @Req() request: any
  ): Promise<AgentProfile> {
    try {
      const authenticatedUserId = request.user.username;
      return await this.agentProfileService.createWithNewAgentAccount(createAgentProfileDto, authenticatedUserId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':agentAccountId')
  @ApiOperation({ summary: 'Get agent profile by agentAccountId' })
  @ApiOkResponse({ type: AgentProfile })
  async findByAgentId(@Param('agentAccountId') agentAccountId: string): Promise<AgentProfile | null> {
    return this.agentProfileService.findByAgentAccountId(agentAccountId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agent profiles' })
  @ApiOkResponse({ type: [AgentProfile] })
  async findAll(): Promise<AgentProfile[]> {
    return this.agentProfileService.findAll();
  }
}
