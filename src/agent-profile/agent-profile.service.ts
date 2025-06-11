import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common'; // Added Inject, forwardRef
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgentProfile } from './entities/agent-profile.entity';
import { CreateAgentProfileDto } from './dto/create-agent-profile.dto';
import { IdentitiesService } from '../identities/identities.service';
import { HcsService } from '../hcs/hcs.service';
import { DidKeyService } from '../did-key/did-key.service';
import { PrivateKey } from '@hashgraph/sdk';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class AgentProfileService {
  constructor(
    @InjectModel(AgentProfile.name) private agentProfileModel: Model<AgentProfile>,
    private readonly identitiesService: IdentitiesService,
    private readonly hcsService: HcsService,
    private readonly didKeyService: DidKeyService,
    @Inject(forwardRef(() => WalletsService)) // Added Inject and forwardRef here
    private readonly walletsService: WalletsService,
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
      const existing = await this.agentProfileModel.findOne({ agentAccountId:agentAccountId });
      console.log('Checking for existing agent profile:', existing);
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
      const savedProfile = await created.save();
      // Remove _id and __v fields before writing to topic
      const profileToWrite = { ...savedProfile.toObject() };
      delete profileToWrite._id;
      delete profileToWrite.__v;
      // Extract topic ID from agentDid (after last underscore)
      const topicId = agentDid.split('_').pop();
      if (topicId) {
        // Fetch private key for agentDid
        const privateKeyStr = await this.didKeyService.getPrivateKeyByDid(agentDid);
        if (privateKeyStr) {
          const privateKey = PrivateKey.fromString(privateKeyStr);
          await this.hcsService.writeMessageToTopic(topicId, JSON.stringify(profileToWrite), privateKey);
        } else {
          await this.hcsService.writeMessageToTopic(topicId, JSON.stringify(profileToWrite));
        }
      }
      return savedProfile;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async createWithNewAgentAccount(createAgentProfileDto: CreateAgentProfileDto, authenticatedUserId: string): Promise<AgentProfile> {
    try {
      // Create agent wallet
      const agentWallet = await this.walletsService.createWallet({ owner: authenticatedUserId, type: 'agent' });
      const agentAccountId = agentWallet.wallet.account.id;

      // Get agent identity and DID
      const agentIdentity = await this.identitiesService.findByAccountId(agentAccountId);
      if (!agentIdentity) throw new BadRequestException('No DID found for this Hedera account');
      const agentDid = agentIdentity.did_id;

      // Get agent owner DID
      let agentOwnerDID = '';
      const ownerIdentity = await this.identitiesService.findByOwner(authenticatedUserId);
      if (ownerIdentity) {
        agentOwnerDID = ownerIdentity.did_id;
      }

      // Prevent duplicate agent profiles by agentAccountId
      const existing = await this.agentProfileModel.findOne({ agentAccountId: agentAccountId });
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

      const savedProfile = await created.save();

      // Remove _id and __v fields before writing to topic
      const profileToWrite = { ...savedProfile.toObject() };
      delete profileToWrite._id;
      delete profileToWrite.__v;

      // Extract topic ID from agentDid (after last underscore)
      const topicId = agentDid.split('_').pop();
      if (topicId) {
        // Fetch private key for agentDid
        const privateKeyStr = await this.didKeyService.getPrivateKeyByDid(agentDid);
        if (privateKeyStr) {
          const privateKey = PrivateKey.fromString(privateKeyStr);
          await this.hcsService.writeMessageToTopic(topicId, JSON.stringify(profileToWrite), privateKey);
        } else {
          await this.hcsService.writeMessageToTopic(topicId, JSON.stringify(profileToWrite));
        }
      }
      return savedProfile;
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
