import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AgentChatService } from './agent-chat.service';
import { AgentAIService } from './agent-ai.service';
import { TranscriptService } from './transcript.service';
import { AgentChatPayloads } from './events/types/events';

@WebSocketGateway({
  namespace: '/agent-chat',
  cors: {
    origin: '*',
    credentials: true
  },
  transports: ['websocket', 'polling']
})
export class AgentChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private readonly logger = new Logger(AgentChatGateway.name);
  
  // Track which clients have already received conversation history for each session
  private sessionHistorySent = new Map<string, Set<string>>(); // sessionId -> Set<clientId>

  constructor(
    private agentChatService: AgentChatService,
    private agentAIService: AgentAIService,
    private transcriptService: TranscriptService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Agent Chat WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Agent chat client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Agent chat client disconnected: ${client.id}`);
    
    // Clean up tracking data for this client
    for (const [sessionId, clientIds] of this.sessionHistorySent.entries()) {
      clientIds.delete(client.id);
      // Remove empty sets to prevent memory leaks
      if (clientIds.size === 0) {
        this.sessionHistorySent.delete(sessionId);
      }
    }
  }

  @SubscribeMessage('agent-join-session')
  async handleAgentJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AgentChatPayloads['AgentJoinSession']
  ) {
    try {
      this.logger.log(`Agent ${payload.agentAccountId} attempting to join session ${payload.sessionId}`);

      // Verify session exists and agent belongs to it
      const session = await this.agentChatService.getSession(payload.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.agent1AccountId !== payload.agentAccountId && 
          session.agent2AccountId !== payload.agentAccountId) {
        throw new Error('Agent does not belong to this session');
      }

      if (session.status !== 'active') {
        throw new Error('Session is not active');
      }

      // Join WebSocket room for this session
      await client.join(payload.sessionId);
      
      // Notify other participants that agent has joined
      client.to(payload.sessionId).emit('agent-joined', { 
        agentId: payload.agentAccountId 
      });

      // Send session info back to the joining client
      client.emit('session-info', {
        sessionId: payload.sessionId,
        otherAgentId: session.agent1AccountId === payload.agentAccountId 
          ? session.agent2AccountId 
          : session.agent1AccountId,
        messageCount: session.messageCount
      });

      // Send recent conversation history (last 50 messages) - only if not already sent to this client
      if (!this.hasReceivedHistory(payload.sessionId, client.id)) {
        const conversation = await this.agentChatService.getConversation(payload.sessionId);
        const recentMessages = conversation.slice(-50).map(msg => ({
          from: msg.fromAgentId,
          message: msg.message,
          timestamp: msg.timestamp,
          metadata: msg.metadata
        }));

        if (recentMessages.length > 0) {
          client.emit('conversation-history', recentMessages);
          this.logger.log(`Sent ${recentMessages.length} conversation history messages to client ${client.id}`);
        }
        
        // Mark this client as having received history for this session
        this.markHistorySent(payload.sessionId, client.id);
      } else {
        this.logger.log(`Client ${client.id} already received conversation history for session ${payload.sessionId}`);
      }

      this.logger.log(`Agent ${payload.agentAccountId} successfully joined session ${payload.sessionId}`);
      
    } catch (error) {
      this.logger.error(`Error handling agent join: ${error.message}`);
      client.emit('error', { 
        message: error.message,
        code: 'JOIN_ERROR'
      });
    }
  }

  @SubscribeMessage('agent-send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AgentChatPayloads['AgentSendMessage']
  ) {
    try {
      this.logger.log(`Message from agent ${payload.fromAgentId} in session ${payload.sessionId}`);

      // Validate message
      if (!payload.message || payload.message.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      if (payload.message.length > 2000) {
        throw new Error('Message too long (max 2000 characters)');
      }

      // Store the original message
      await this.agentChatService.storeMessage(
        payload.sessionId,
        payload.fromAgentId,
        payload.message.trim()
      );

      // Get session to determine the other agent
      const session = await this.agentChatService.getSession(payload.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Broadcast the original message only
      const messageData = {
        from: payload.fromAgentId,
        message: payload.message.trim(),
        timestamp: new Date()
      };

      this.server.to(payload.sessionId).emit('new-message', messageData);

      this.logger.log(`Successfully processed message in session ${payload.sessionId}`);

    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`);
      client.emit('error', { 
        message: error.message,
        code: 'MESSAGE_ERROR'
      });
    }
  }

  @SubscribeMessage('trigger-ai-response')
  async handleTriggerAI(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; agentAccountId: string }
  ) {
    try {
      this.logger.log(`AI trigger requested for agent ${payload.agentAccountId} in session ${payload.sessionId}`);

      // Verify session exists and is active
      const session = await this.agentChatService.getSession(payload.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status !== 'active') {
        throw new Error('Session is not active');
      }

      // Verify agent belongs to session
      if (session.agent1AccountId !== payload.agentAccountId && 
          session.agent2AccountId !== payload.agentAccountId) {
        throw new Error('Agent does not belong to this session');
      }

      // Notify clients that AI is thinking
      this.server.to(payload.sessionId).emit('ai-thinking', {
        agentId: payload.agentAccountId
      });

      // Get current conversation for AI context
      const conversation = await this.agentChatService.getConversation(payload.sessionId);
      const lastMessage = conversation.length > 0 ? conversation[conversation.length - 1].message : '';

      // Build conversation context for enhanced AI
      const conversationContext = {
        sessionId: payload.sessionId,
        messageCount: conversation.length,
        participants: [session.agent1AccountId, session.agent2AccountId],
        currentAgent: payload.agentAccountId,
        otherAgent: session.agent1AccountId === payload.agentAccountId ? session.agent2AccountId : session.agent1AccountId,
        sessionMetadata: session.metadata
      };

      // Generate AI response with enhanced context
      let aiResponse: string;
      let aiMetadata: any = {};
      
      try {
        const aiResult = await this.agentAIService.generateResponse(
          payload.agentAccountId,
          conversation,
          lastMessage,
          conversationContext
        );
        aiResponse = aiResult.response;
        aiMetadata = aiResult.metadata;
      } catch (aiError) {
        this.logger.error(`AI generation failed: ${aiError.message}`);
        
        // Send AI skip event if it's a loop prevention
        if (aiError.message.includes('prevent loops')) {
          this.server.to(payload.sessionId).emit('ai-skip', {
            agentId: payload.agentAccountId,
            reason: 'loop-prevention'
          });
          return;
        }
        
        aiResponse = "I'm having trouble responding right now. Could you please try again?";
        aiMetadata = { error: aiError.message };
      }

      // Store AI response
      await this.agentChatService.storeMessage(
        payload.sessionId,
        payload.agentAccountId,
        aiResponse,
        aiMetadata
      );

      // Broadcast AI response
      const responseData = {
        from: payload.agentAccountId,
        message: aiResponse,
        timestamp: new Date(),
        metadata: aiMetadata
      };

      this.server.to(payload.sessionId).emit('ai-response-generated', responseData);

      this.logger.log(`AI response generated for agent ${payload.agentAccountId} in session ${payload.sessionId}`);

    } catch (error) {
      this.logger.error(`Error generating AI response: ${error.message}`);
      client.emit('error', { 
        message: error.message,
        code: 'AI_TRIGGER_ERROR'
      });
    }
  }

  @SubscribeMessage('end-session')
  async handleEndSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AgentChatPayloads['EndSession']
  ) {
    try {
      this.logger.log(`Ending session ${payload.sessionId}`);

      // Verify session exists
      const session = await this.agentChatService.getSession(payload.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status === 'ended') {
        throw new Error('Session already ended');
      }

      // End the session
      await this.agentChatService.endSession(payload.sessionId);

      let transcriptSubmitted = false;
      try {
        // Generate and submit transcript to Hedera
        await this.transcriptService.submitSessionTranscript(payload.sessionId);
        transcriptSubmitted = true;
      } catch (transcriptError) {
        this.logger.error(`Failed to submit transcript: ${transcriptError.message}`);
        // Don't fail the session end, just log the error
      }

      // Notify all participants that session has ended
      this.server.to(payload.sessionId).emit('session-ended', {
        sessionId: payload.sessionId,
        transcriptSubmitted
      });

      // Remove all clients from this session room
      const room = this.server.sockets.adapter.rooms.get(payload.sessionId);
      if (room) {
        room.forEach(socketId => {
          const socket = this.server.sockets.sockets.get(socketId);
          if (socket) {
            socket.leave(payload.sessionId);
          }
        });
      }

      this.logger.log(`Successfully ended session ${payload.sessionId}`);

    } catch (error) {
      this.logger.error(`Error ending session: ${error.message}`);
      client.emit('error', { 
        message: error.message,
        code: 'END_SESSION_ERROR'
      });
    }
  }

  @SubscribeMessage('get-session-status')
  async handleGetSessionStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string }
  ) {
    try {
      const session = await this.agentChatService.getSession(payload.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      client.emit('session-status', {
        sessionId: payload.sessionId,
        status: session.status,
        messageCount: session.messageCount,
        startTime: session.createdAt,
        endTime: session.endedAt,
        transcriptSubmitted: session.transcriptSubmitted
      });

    } catch (error) {
      client.emit('error', { 
        message: error.message,
        code: 'STATUS_ERROR'
      });
    }
  }

  @SubscribeMessage('get-conversation-history')
  async handleGetConversationHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; force?: boolean }
  ) {
    try {
      const session = await this.agentChatService.getSession(payload.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Check if we should send history (either forced or not sent before)
      const shouldSend = payload.force || !this.hasReceivedHistory(payload.sessionId, client.id);
      
      if (shouldSend) {
        const conversation = await this.agentChatService.getConversation(payload.sessionId);
        const recentMessages = conversation.slice(-50).map(msg => ({
          from: msg.fromAgentId,
          message: msg.message,
          timestamp: msg.timestamp,
          metadata: msg.metadata
        }));

        client.emit('conversation-history', recentMessages);
        this.markHistorySent(payload.sessionId, client.id);
        
        this.logger.log(`Sent ${recentMessages.length} conversation history messages to client ${client.id} (${payload.force ? 'forced' : 'first-time'})`);
      } else {
        client.emit('conversation-history-cached', { 
          message: 'Conversation history already sent to this client' 
        });
      }

    } catch (error) {
      client.emit('error', { 
        message: error.message,
        code: 'HISTORY_ERROR'
      });
    }
  }

  @SubscribeMessage('stream-conversation-messages')
  async handleStreamMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; startIndex?: number; batchSize?: number }
  ) {
    try {
      const session = await this.agentChatService.getSession(payload.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const startIndex = payload.startIndex || 0;
      const batchSize = payload.batchSize || 10;
      
      const conversation = await this.agentChatService.getConversation(payload.sessionId);
      const messageBatch = conversation.slice(startIndex, startIndex + batchSize);
      
      const formattedMessages = messageBatch.map((msg, index) => ({
        from: msg.fromAgentId,
        message: msg.message,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
        index: startIndex + index,
        isLast: (startIndex + index) === (conversation.length - 1)
      }));

      // Send messages one by one with a small delay for better UX
      for (const message of formattedMessages) {
        client.emit('message-stream', message);
        // Small delay to allow frontend to process each message
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Send stream completion event
      client.emit('message-stream-complete', {
        totalMessages: conversation.length,
        sentCount: formattedMessages.length,
        nextStartIndex: startIndex + batchSize,
        hasMore: (startIndex + batchSize) < conversation.length
      });

      this.logger.log(`Streamed ${formattedMessages.length} messages to client ${client.id} for session ${payload.sessionId}`);

    } catch (error) {
      client.emit('error', { 
        message: error.message,
        code: 'STREAM_ERROR'
      });
    }
  }

  @SubscribeMessage('user-send-message-on-behalf')
  async handleUserMessageOnBehalf(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; agentId: string; message: string; triggerAI?: boolean }
  ) {
    try {
      this.logger.log(`User sending message on behalf of agent ${payload.agentId} in session ${payload.sessionId}`);

      // Validate session and agent
      const session = await this.agentChatService.getSession(payload.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.agent1AccountId !== payload.agentId && session.agent2AccountId !== payload.agentId) {
        throw new Error('Agent does not belong to this session');
      }

      if (session.status !== 'active') {
        throw new Error('Session is not active');
      }

      // Store the user's message on behalf of the agent
      await this.agentChatService.storeMessage(
        payload.sessionId,
        payload.agentId,
        payload.message.trim(),
        { 
          sentBy: 'user',
          onBehalfOf: payload.agentId,
          timestamp: new Date()
        }
      );

      // Broadcast the message
      const messageData = {
        from: payload.agentId,
        message: payload.message.trim(),
        timestamp: new Date(),
        metadata: { sentBy: 'user', onBehalfOf: payload.agentId }
      };

      this.server.to(payload.sessionId).emit('new-message', messageData);

      // If triggerAI is requested, automatically trigger the other agent's AI response
      if (payload.triggerAI) {
        const otherAgentId = session.agent1AccountId === payload.agentId 
          ? session.agent2AccountId 
          : session.agent1AccountId;

        // Trigger AI response for the other agent after a brief delay
        setTimeout(() => {
          this.handleTriggerAI(client, { 
            sessionId: payload.sessionId, 
            agentAccountId: otherAgentId 
          });
        }, 500);
      }

      client.emit('message-sent-on-behalf', {
        sessionId: payload.sessionId,
        agentId: payload.agentId,
        success: true
      });

      this.logger.log(`Successfully processed user message on behalf of agent ${payload.agentId}`);

    } catch (error) {
      this.logger.error(`Error handling user message on behalf: ${error.message}`);
      client.emit('error', { 
        message: error.message,
        code: 'USER_MESSAGE_ERROR'
      });
    }
  }

  // Method to broadcast system messages to a session
  async broadcastToSession(sessionId: string, event: string, data: any) {
    this.server.to(sessionId).emit(event, data);
  }

  // Helper methods for tracking conversation history delivery
  private hasReceivedHistory(sessionId: string, clientId: string): boolean {
    const clientIds = this.sessionHistorySent.get(sessionId);
    return clientIds ? clientIds.has(clientId) : false;
  }

  private markHistorySent(sessionId: string, clientId: string): void {
    if (!this.sessionHistorySent.has(sessionId)) {
      this.sessionHistorySent.set(sessionId, new Set());
    }
    this.sessionHistorySent.get(sessionId).add(clientId);
  }

  // Method to reset history tracking for a session (useful when new messages are added)
  private resetSessionHistoryTracking(sessionId: string): void {
    this.sessionHistorySent.delete(sessionId);
  }
}