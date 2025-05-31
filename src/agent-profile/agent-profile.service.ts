import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgentProfile } from './entities/agent-profile.entity';
import { CreateAgentProfileDto } from './dto/create-agent-profile.dto';
import { IdentitiesService } from '../identities/identities.service';

@Injectable()
export class AgentProfileService {
  constructor(
    @InjectModel(AgentProfile.name) private agentProfileModel: Model<AgentProfile>,
    private readonly identitiesService: IdentitiesService,
  ) {}

  async create(createAgentProfileDto: CreateAgentProfileDto): Promise<AgentProfile> {
    const { hederaAccountId } = createAgentProfileDto;
    const identity = await this.identitiesService.findByAccountId(hederaAccountId);
    if (!identity) throw new Error('No DID found for this Hedera account');
    const agentDid = identity.did_id;
    const created = new this.agentProfileModel({ ...createAgentProfileDto, agentDid });
    return created.save();
  }

  async findByAgentId(agentId: string): Promise<AgentProfile | null> {
    return this.agentProfileModel.findOne({ agentId });
  }

  async findAll(): Promise<AgentProfile[]> {
    return this.agentProfileModel.find();
  }
}
