import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgentProfile } from './entities/agent-profile.entity';
import { CreateAgentProfileDto } from './dto/create-agent-profile.dto';
import { IdentitiesService } from '../identities/identities.service';
import { HcsService } from '../hcs/hcs.service';

@Injectable()
export class AgentProfileService {
  constructor(
    @InjectModel(AgentProfile.name) private agentProfileModel: Model<AgentProfile>,
    private readonly identitiesService: IdentitiesService,
    private readonly hcsService: HcsService,
  ) {}

  async create(createAgentProfileDto: CreateAgentProfileDto, agentAccountId: string): Promise<AgentProfile> {
    try {
      // Get agent identity and DID
      const agentIdentity = await this.identitiesService.findByAccountId(agentAccountId);
      if (!agentIdentity) throw new BadRequestException('No DID found for this Hedera account');
      const agentDid = agentIdentity.did_id;
      // Get agent owner DID via wallet
      let agentOwnerDID = '';
      let wallet = await this.identitiesService.findWalletByAccountId(agentAccountId);
      if (wallet && wallet.owner) {
        const ownerIdentity = await this.identitiesService.findByOwner(wallet.owner);
        if (ownerIdentity) {
          agentOwnerDID = ownerIdentity.did_id;
        }
      }
      // Prevent duplicate agent profiles by agentId
      const existing = await this.agentProfileModel.findOne({ agentId: createAgentProfileDto.agentId });
      if (existing) {
        throw new BadRequestException('Agent profile with this agentId already exists.');
      }
      // Create topics using HcsService with correct memos
      const inboundTopic = await this.hcsService.createHcsTopic('Channel for receiving connection requests');
      const outboundTopic = await this.hcsService.createHcsTopic('Public record of an agent\'s actions');
      const communicationTopic = await this.hcsService.createHcsTopic('Private channel between two or more agents');
      const created = new this.agentProfileModel({
        ...createAgentProfileDto,
        agentDid,
        agentOwnerDID,
        agentAccountId,
        inboundTopicId: inboundTopic.topicId,
        outboundTopicId: outboundTopic.topicId,
        communicationTopicId: communicationTopic.topicId,
      });
      return created.save();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async findByAgentId(agentId: string): Promise<AgentProfile | null> {
    return this.agentProfileModel.findOne({ agentId });
  }

  async findByAgentAccountId(agentAccountId: string): Promise<AgentProfile | null> {
    return this.agentProfileModel.findOne({ agentAccountId });
  }

  async findAll(): Promise<AgentProfile[]> {
    return this.agentProfileModel.find();
  }
}
