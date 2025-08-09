import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AgentChatSession, AgentChatSessionDocument } from './entities/agent-chat-session.entity';
import { SessionMessage, SessionMessageDocument } from './entities/session-message.entity';
import { AgentProfileService } from '../agent-profile/agent-profile.service';

@Injectable()
export class AgentChatService {
  constructor(
    @InjectModel(AgentChatSession.name) private sessionModel: Model<AgentChatSessionDocument>,
    @InjectModel(SessionMessage.name) private messageModel: Model<SessionMessageDocument>,
    private agentProfileService: AgentProfileService,
  ) {}

  async createChatSession(
    agent1AccountId: string, 
    agent2AccountId: string, 
    userId: string,
    preferredTopicAgent?: 'agent1' | 'agent2'
  ): Promise<{ sessionId: string; websocketUrl: string }> {
    // Get user's DID from userId
    const userDid = await this.getUserDid(userId);

    // Verify both agents have DIDs
    await this.verifyAgentOwnership(agent1AccountId);
    await this.verifyAgentOwnership(agent2AccountId);

    // Ensure agents are different
    if (agent1AccountId === agent2AccountId) {
      throw new BadRequestException('Cannot create chat session between the same agent');
    }

    // Check if active session already exists between these agents
    const existingSession = await this.sessionModel.findOne({
      $or: [
        { agent1AccountId, agent2AccountId, status: 'active' },
        { agent1AccountId: agent2AccountId, agent2AccountId: agent1AccountId, status: 'active' }
      ]
    });

    if (existingSession) {
      return {
        sessionId: existingSession.id,
        websocketUrl: process.env.WEBSOCKET_URL || `ws://localhost:${process.env.PORT || 4001}`
      };
    }

    // Get agent profiles for metadata and validation
    const agent1Profile = await this.agentProfileService.findByAgentAccountId(agent1AccountId);
    const agent2Profile = await this.agentProfileService.findByAgentAccountId(agent2AccountId);

    // Validate that preferred agent has communicationTopicId for transcript submission
    const preferredAgentProfile = (preferredTopicAgent === 'agent2') ? agent2Profile : agent1Profile;
    const preferredAgentId = (preferredTopicAgent === 'agent2') ? agent2AccountId : agent1AccountId;
    
    if (!preferredAgentProfile?.communicationTopicId) {
      throw new BadRequestException(
        `Selected agent for transcript submission (${preferredTopicAgent}: ${preferredAgentId}) does not have a valid communicationTopicId. Please select the other agent or ensure the agent is properly configured.`
      );
    }

    // Create new session
    const sessionId = uuidv4();
    const session = new this.sessionModel({
      id: sessionId,
      agent1AccountId,
      agent2AccountId,
      userDid,
      status: 'active',
      messageCount: 0,
      preferredTopicAgent: preferredTopicAgent || 'agent1',
      metadata: {
        agent1Profile: agent1Profile ? {
          name: agent1Profile.agentName,
          type: agent1Profile.agentType,
          category: agent1Profile.agentCategory
        } : null,
        agent2Profile: agent2Profile ? {
          name: agent2Profile.agentName,
          type: agent2Profile.agentType,
          category: agent2Profile.agentCategory
        } : null,
        sessionTitle: `${agent1Profile?.agentName || agent1AccountId} & ${agent2Profile?.agentName || agent2AccountId}`,
        lastActivity: new Date()
      }
    });

    await session.save();

    return {
      sessionId,
      websocketUrl: process.env.WEBSOCKET_URL || `ws://localhost:${process.env.PORT || 4001}`
    };
  }

  async getSession(sessionId: string): Promise<AgentChatSession | null> {
    return this.sessionModel.findOne({ id: sessionId }).exec();
  }

  async getUserSessions(userId: string): Promise<AgentChatSession[]> {
    const userDid = await this.getUserDid(userId);
    return this.sessionModel
      .find({ userDid })
      .sort({ createdAt: -1 })
      .exec();
  }

  async storeMessage(
    sessionId: string, 
    fromAgentId: string, 
    message: string, 
    metadata?: any
  ): Promise<void> {
    // Verify session exists and is active
    const session = await this.sessionModel.findOne({ id: sessionId, status: 'active' });
    if (!session) {
      throw new NotFoundException('Session not found or inactive');
    }

    // Verify agent belongs to session
    if (fromAgentId !== session.agent1AccountId && fromAgentId !== session.agent2AccountId) {
      throw new UnauthorizedException('Agent does not belong to this session');
    }

    // Store message
    const sessionMessage = new this.messageModel({
      sessionId,
      fromAgentId,
      message,
      metadata,
      timestamp: new Date()
    });

    await sessionMessage.save();

    // Update session message count and last activity
    await this.sessionModel.updateOne(
      { id: sessionId },
      {
        $inc: { messageCount: 1 },
        $set: { 'metadata.lastActivity': new Date() }
      }
    );
  }

  async getConversation(sessionId: string): Promise<SessionMessage[]> {
    return this.messageModel
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .exec();
  }

  async endSession(sessionId: string): Promise<boolean> {
    const result = await this.sessionModel.updateOne(
      { id: sessionId },
      {
        $set: {
          status: 'ended',
          endedAt: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  }

  async markTranscriptSubmitted(sessionId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { id: sessionId },
      { $set: { transcriptSubmitted: true } }
    );
  }

  async cleanupSessionMessages(sessionId: string): Promise<void> {
    await this.messageModel.deleteMany({ sessionId });
  }

  async verifySessionAccess(sessionId: string, userId: string): Promise<boolean> {
    const userDid = await this.getUserDid(userId);
    const session = await this.sessionModel.findOne({ id: sessionId, userDid });
    return !!session;
  }

  private async verifyAgentOwnership(agentAccountId: string): Promise<void> {
    try {
      const agentProfile = await this.agentProfileService.findByAgentAccountId(agentAccountId);
      if (!agentProfile) {
        throw new NotFoundException(`Agent ${agentAccountId} not found`);
      }

      // Simple check: if agent has a DID, it's valid for chat
      if (!agentProfile.agentDid) {
        throw new UnauthorizedException(`Agent ${agentAccountId} does not have a DID`);
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(`Failed to verify ownership of agent ${agentAccountId}`);
    }
  }

  private async getUserDid(userId: string): Promise<string> {
    // For now, we'll use username as user identifier
    // TODO: Implement proper user DID lookup when DID system is integrated
    try {
      // Temporary implementation - using username as identifier
      return userId;
    } catch (error) {
      throw new UnauthorizedException('Failed to get user identifier');
    }
  }
}