import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AgentChatService } from './agent-chat.service';
import { AgentAIService } from './agent-ai.service';
import { TranscriptService } from './transcript.service';
import { AgentProfileService } from '../agent-profile/agent-profile.service';
import { CreateAgentChatSessionDto } from './dto/conversation.dto';

@ApiTags('Agent Chat')
@Controller('api/agent-chat')
@ApiBearerAuth('Bearer')
export class AgentChatController {
  constructor(
    private agentChatService: AgentChatService,
    private agentAIService: AgentAIService,
    private transcriptService: TranscriptService,
    private agentProfileService: AgentProfileService,
  ) {}

  @Post('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new agent chat session' })
  @ApiBody({ type: CreateAgentChatSessionDto })
  @ApiResponse({ status: 201, description: 'Chat session created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid agents or user does not own agents' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createSession(
    @Body() body: CreateAgentChatSessionDto,
    @Request() req: any
  ) {
    try {
      const userId = this.extractUserIdFromRequest(req);
      const result = await this.agentChatService.createChatSession(
        body.agent1AccountId,
        body.agent2AccountId,
        userId,
        body.preferredTopicAgent
      );

      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create chat session',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('sessions/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get chat session details' })
  @ApiResponse({ status: 200, description: 'Session details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSession(
    @Param('sessionId') sessionId: string,
    @Request() req: any
  ) {
    try {
      const userId = this.extractUserIdFromRequest(req);
      
      // Verify user has access to this session
      const hasAccess = await this.agentChatService.verifySessionAccess(sessionId, userId);
      if (!hasAccess) {
        throw new HttpException('Access denied to this session', HttpStatus.FORBIDDEN);
      }

      const session = await this.agentChatService.getSession(sessionId);
      if (!session) {
        throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: await this.transformSessionResponse(session)
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get session',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user chat sessions' })
  @ApiResponse({ status: 200, description: 'User sessions retrieved successfully' })
  async getUserSessions(
    @Request() req: any,
    @Query('status') status?: 'active' | 'ended'
  ) {
    try {
      const userId = this.extractUserIdFromRequest(req);
      const sessions = await this.agentChatService.getUserSessions(userId);
      
      // Filter by status if provided
      const filteredSessions = status 
        ? sessions.filter(session => session.status === status)
        : sessions;

      const transformedSessions = await Promise.all(
        filteredSessions.map(session => this.transformSessionResponse(session))
      );

      return {
        success: true,
        data: transformedSessions,
        count: transformedSessions.length
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get user sessions',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('sessions/:sessionId/messages')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get conversation messages for a session' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
  async getConversation(
    @Param('sessionId') sessionId: string,
    @Request() req: any
  ) {
    try {
      const userId = this.extractUserIdFromRequest(req);
      
      // Verify access
      const hasAccess = await this.agentChatService.verifySessionAccess(sessionId, userId);
      if (!hasAccess) {
        throw new HttpException('Access denied to this session', HttpStatus.FORBIDDEN);
      }

      const messages = await this.agentChatService.getConversation(sessionId);

      return {
        success: true,
        data: messages,
        count: messages.length
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get conversation',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete('sessions/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'End a chat session' })
  @ApiResponse({ status: 200, description: 'Session ended successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async endSession(
    @Param('sessionId') sessionId: string,
    @Request() req: any
  ) {
    try {
      const userId = this.extractUserIdFromRequest(req);
      
      // Verify access
      const hasAccess = await this.agentChatService.verifySessionAccess(sessionId, userId);
      if (!hasAccess) {
        throw new HttpException('Access denied to this session', HttpStatus.FORBIDDEN);
      }

      const success = await this.agentChatService.endSession(sessionId);
      if (!success) {
        throw new HttpException('Failed to end session', HttpStatus.BAD_REQUEST);
      }

      // Try to submit transcript with auth token
      let transcriptResult = null;
      try {
        const authToken = this.extractAuthTokenFromRequest(req);
        transcriptResult = await this.transcriptService.submitSessionTranscript(sessionId, authToken);
      } catch (transcriptError) {
        // Log error but don't fail the request
        console.error('Failed to submit transcript:', transcriptError);
      }

      return {
        success: true,
        data: {
          sessionId,
          ended: true,
          transcriptSubmitted: !!transcriptResult?.success,
          transcriptTransactions: transcriptResult?.transactions || []
        }
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to end session',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('sessions/:sessionId/transcript-status')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get transcript submission status' })
  @ApiResponse({ status: 200, description: 'Transcript status retrieved successfully' })
  async getTranscriptStatus(
    @Param('sessionId') sessionId: string,
    @Request() req: any
  ) {
    try {
      const userId = this.extractUserIdFromRequest(req);
      
      // Verify access
      const hasAccess = await this.agentChatService.verifySessionAccess(sessionId, userId);
      if (!hasAccess) {
        throw new HttpException('Access denied to this session', HttpStatus.FORBIDDEN);
      }

      const status = await this.transcriptService.getTranscriptStatus(sessionId);

      return {
        success: true,
        data: status
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get transcript status',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('sessions/:sessionId/transcript')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get stored session transcript' })
  @ApiResponse({ status: 200, description: 'Transcript retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transcript not found' })
  async getTranscript(
    @Param('sessionId') sessionId: string,
    @Request() req: any
  ) {
    try {
      const userId = this.extractUserIdFromRequest(req);
      
      // Verify access
      const hasAccess = await this.agentChatService.verifySessionAccess(sessionId, userId);
      if (!hasAccess) {
        throw new HttpException('Access denied to this session', HttpStatus.FORBIDDEN);
      }

      const transcript = await this.transcriptService.getStoredTranscript(sessionId);
      if (!transcript) {
        throw new HttpException('Transcript not found for this session', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: {
          sessionId: transcript.sessionId,
          agent1AccountId: transcript.agent1AccountId,
          agent2AccountId: transcript.agent2AccountId,
          messageCount: transcript.messageCount,
          transcript: transcript.transcript,
          communicationTopicId: transcript.communicationTopicId,
          submittedToHcs: transcript.submittedToHcs,
          hcsTransactionId: transcript.hcsTransactionId,
          hashscanUrl: transcript.hashscanUrl,
          createdAt: (transcript as any).createdAt,
          updatedAt: (transcript as any).updatedAt
        }
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get transcript',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }


  @Post('sessions/:sessionId/generate-transcript')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Manually generate and store transcript for a session' })
  @ApiResponse({ status: 200, description: 'Transcript generated and stored successfully' })
  async generateTranscript(
    @Param('sessionId') sessionId: string,
    @Request() req: any
  ) {
    try {
      const userId = this.extractUserIdFromRequest(req);
      
      // Verify access
      const hasAccess = await this.agentChatService.verifySessionAccess(sessionId, userId);
      if (!hasAccess) {
        throw new HttpException('Access denied to this session', HttpStatus.FORBIDDEN);
      }

      const authToken = this.extractAuthTokenFromRequest(req);
      const result = await this.transcriptService.submitSessionTranscript(sessionId, authToken);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate transcript',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('agents/:agentAccountId/ai-config')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get AI configuration status for an agent' })
  @ApiResponse({ status: 200, description: 'AI configuration status retrieved successfully' })
  async getAIConfig(@Param('agentAccountId') agentAccountId: string) {
    try {
      const config = await this.agentAIService.getAgentAIConfig(agentAccountId);

      return {
        success: true,
        data: config
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get AI configuration',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  private extractUserIdFromRequest(req: any): string {
    // Extract user ID from JWT token based on existing auth system
    if (req.user?.sub) {
      return req.user.sub;
    }
    
    if (req.user?._id) {
      return req.user._id;
    }

    if (req.user?.username) {
      return req.user.username;
    }

    throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
  }

  private extractAuthTokenFromRequest(req: any): string | undefined {
    // Extract Bearer token from Authorization header
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    return undefined;
  }

  private async transformSessionResponse(session: any) {
    // Get communicationTopicId from agent1's profile
    let communicationTopicId = null;
    try {
      const agent1Profile = await this.agentProfileService.findByAgentAccountId(session.agent1AccountId);
      communicationTopicId = agent1Profile?.communicationTopicId;
    } catch (error) {
      // If we can't fetch the profile, just leave it null
      console.warn(`Could not fetch agent profile for ${session.agent1AccountId}:`, error.message);
    }

    return {
      userId: session._id?.toString(),
      sessionId: session.id,
      agent1AccountId: session.agent1AccountId,
      agent2AccountId: session.agent2AccountId,
      status: session.status,
      messageCount: session.messageCount,
      transcriptSubmitted: session.transcriptSubmitted,
      communicationTopicId,
      metadata: session.metadata,
      createdAt: session.createdAt,
      endedAt: session.endedAt
    };
  }
}