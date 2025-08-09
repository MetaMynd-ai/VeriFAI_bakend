import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentChatService } from './agent-chat.service';
import { AgentProfileService } from '../agent-profile/agent-profile.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import OpenAI from 'openai';

// Schema for storing transcripts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SessionTranscriptDocument = SessionTranscript & Document;

@Schema({ timestamps: true })
export class SessionTranscript {
  @Prop({ required: true, unique: true })
  sessionId: string;

  @Prop({ required: true })
  agent1AccountId: string;

  @Prop({ required: true })
  agent2AccountId: string;

  @Prop({ required: true })
  messageCount: number;

  @Prop({ type: Object, required: true })
  transcript: any;

  @Prop({ required: true })
  communicationTopicId: string;

  @Prop({ default: null })
  hcsTransactionId: string;

  @Prop({ default: null })
  hashscanUrl: string;

  @Prop({ default: false })
  submittedToHcs: boolean;

  @Prop({ type: Object })
  metadata: any;
}

export const SessionTranscriptSchema = SchemaFactory.createForClass(SessionTranscript);

@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);
  private readonly baseUrl: string;
  private readonly openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private agentChatService: AgentChatService,
    private agentProfileService: AgentProfileService,
    @InjectModel(SessionTranscript.name) private transcriptModel: Model<SessionTranscriptDocument>,
  ) {
    this.baseUrl = this.configService.get<string>('app.baseUrl', 'http://localhost:4001');
    
    // Initialize OpenAI for transcript processing
    const apiKey = this.configService.get<string>('openAI.apiKey');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async submitSessionTranscript(sessionId: string, authToken?: string): Promise<{
    success: boolean;
    transcriptId: string;
    hcsTransactionId?: string;
    hashscanUrl?: string;
    isNew?: boolean;
  }> {
    try {
      this.logger.log(`Starting transcript submission for session ${sessionId}`);

      // 1. Check if transcript already exists
      const existingTranscript = await this.transcriptModel.findOne({ sessionId }).exec();
      if (existingTranscript) {
        this.logger.log(`Transcript already exists for session ${sessionId}`);
        
        // If not submitted to HCS yet, try to submit it
        if (!existingTranscript.submittedToHcs) {
          this.logger.log(`Attempting to submit existing transcript to HCS`);
          try {
            const hcsResult = await this.submitTranscriptToHcs(
              existingTranscript.communicationTopicId,
              existingTranscript.transcript,
              authToken
            );
            
            await this.transcriptModel.updateOne(
              { sessionId },
              {
                hcsTransactionId: hcsResult.transactionId,
                hashscanUrl: hcsResult.hashscanUrl,
                submittedToHcs: true
              }
            );
            
            return {
              success: true,
              transcriptId: existingTranscript._id.toString(),
              hcsTransactionId: hcsResult.transactionId,
              hashscanUrl: hcsResult.hashscanUrl,
              isNew: false
            };
          } catch (hcsError) {
            this.logger.error(`Failed to submit existing transcript to HCS: ${hcsError.message}`);
          }
        }
        
        // Return existing transcript info
        return {
          success: true,
          transcriptId: existingTranscript._id.toString(),
          hcsTransactionId: existingTranscript.hcsTransactionId,
          hashscanUrl: existingTranscript.hashscanUrl,
          isNew: false
        };
      }

      // 2. Get session details
      const session = await this.agentChatService.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // 3. Fetch complete conversation via direct service call
      const messagesResponse = await this.fetchSessionMessages(sessionId, authToken);
      if (!messagesResponse.success || messagesResponse.data.length === 0) {
        this.logger.warn(`No messages found for session ${sessionId}, skipping transcript submission`);
        throw new Error(`No messages found for session ${sessionId}`);
      }

      // 4. Format transcript as JSON with metadata
      const transcript = this.formatTranscriptAsJson(messagesResponse.data, session);

      // 5. Get communicationTopicId based on session preference
      const preferredAgent = session.preferredTopicAgent || 'agent1';
      const targetAccountId = preferredAgent === 'agent1' ? session.agent1AccountId : session.agent2AccountId;
      
      const agentProfile = await this.agentProfileService.findByAgentAccountId(targetAccountId);
      this.logger.log(`Using ${preferredAgent} for blockchain submission - Agent ${targetAccountId}: ${JSON.stringify({ 
        found: !!agentProfile, 
        communicationTopicId: agentProfile?.communicationTopicId 
      })}`);
      
      if (!agentProfile?.communicationTopicId) {
        throw new Error(`No communicationTopicId found for ${preferredAgent} (${targetAccountId})`);
      }

      // 6. Store transcript in database first
      const storedTranscript = await this.storeTranscriptInDatabase(
        sessionId,
        session.agent1AccountId,
        session.agent2AccountId,
        messagesResponse.count,
        transcript,
        agentProfile.communicationTopicId
      );

      // 7. Process transcript with LLM for blockchain storage
      let blockchainTranscript;
      try {
        this.logger.log(`Starting LLM processing for transcript with ${transcript.conversation?.length || 0} messages`);
        blockchainTranscript = await this.processTranscriptWithLLM(transcript);
        this.logger.log(`LLM processed transcript successfully - output length: ${JSON.stringify(blockchainTranscript).length} chars`);
      } catch (llmError) {
        this.logger.error(`LLM processing failed: ${llmError.message}`);
        this.logger.warn(`Falling back to original transcript format`);
        blockchainTranscript = transcript; // Fallback to original
      }

      // 8. Submit processed transcript to HCS via HTTP endpoint
      let hcsResult = null;
      try {
        hcsResult = await this.submitTranscriptToHcs(
          agentProfile.communicationTopicId,
          blockchainTranscript,
          authToken
        );
        
        // Update database with HCS transaction details
        await this.transcriptModel.updateOne(
          { sessionId },
          {
            hcsTransactionId: hcsResult.transactionId,
            hashscanUrl: hcsResult.hashscanUrl,
            submittedToHcs: true
          }
        );
      } catch (hcsError) {
        this.logger.error(`Failed to submit transcript to HCS: ${hcsError.message}`);
        // Store error details in database for debugging
        await this.transcriptModel.updateOne(
          { sessionId },
          {
            submittedToHcs: false,
            metadata: {
              ...storedTranscript.metadata,
              hcsError: {
                message: hcsError.message,
                timestamp: new Date().toISOString(),
                stack: hcsError.stack
              }
            }
          }
        );
        // Don't fail the whole process, transcript is still stored in DB
      }

      // 9. Mark session as transcript submitted
      await this.agentChatService.markTranscriptSubmitted(sessionId);

      // 10. Cleanup temporary messages
      await this.agentChatService.cleanupSessionMessages(sessionId);

      this.logger.log(`Successfully processed transcript for session ${sessionId}`);

      return {
        success: true,
        transcriptId: storedTranscript._id.toString(),
        hcsTransactionId: hcsResult?.transactionId,
        hashscanUrl: hcsResult?.hashscanUrl,
        isNew: true
      };

    } catch (error) {
      this.logger.error(`Error submitting transcript for session ${sessionId}:`, error);
      throw error;
    }
  }

  private async fetchSessionMessages(sessionId: string, authToken?: string): Promise<{
    success: boolean;
    data: any[];
    count: number;
  }> {
    // Skip HTTP call and use direct service call for better reliability
    this.logger.log('Using direct service call to fetch session messages');
    const messages = await this.agentChatService.getConversation(sessionId);
    this.logger.log(`Direct service returned ${messages.length} messages`);
    return {
      success: true,
      data: messages,
      count: messages.length
    };
  }

  private formatTranscriptAsJson(messages: any[], session: any): any {
    return {
      sessionInfo: {
        sessionId: session.id,
        agent1AccountId: session.agent1AccountId,
        agent1Name: session.metadata?.agent1Profile?.name || 'Unknown',
        agent2AccountId: session.agent2AccountId,
        agent2Name: session.metadata?.agent2Profile?.name || 'Unknown',
        status: session.status,
        messageCount: messages.length,
        startedAt: session.createdAt,
        endedAt: session.endedAt,
        transcriptGeneratedAt: new Date().toISOString()
      },
      conversation: messages.map(msg => ({
        messageId: msg._id,
        fromAgentId: msg.fromAgentId,
        fromAgentName: msg.fromAgentId === session.agent1AccountId
          ? (session.metadata?.agent1Profile?.name || session.agent1AccountId)
          : (session.metadata?.agent2Profile?.name || session.agent2AccountId),
        message: msg.message,
        timestamp: msg.timestamp,
        metadata: msg.metadata || null
      })),
      summary: {
        totalMessages: messages.length,
        transcriptType: 'agent-chat-session',
        version: '1.0'
      }
    };
  }

  private async storeTranscriptInDatabase(
    sessionId: string,
    agent1AccountId: string,
    agent2AccountId: string,
    messageCount: number,
    transcript: any,
    communicationTopicId: string
  ): Promise<SessionTranscriptDocument> {
    const transcriptDoc = new this.transcriptModel({
      sessionId,
      agent1AccountId,
      agent2AccountId,
      messageCount,
      transcript,
      communicationTopicId,
      metadata: {
        storedAt: new Date(),
        version: '1.0'
      }
    });

    return await transcriptDoc.save();
  }

  private async submitTranscriptToHcs(topicId: string, transcript: any, authToken?: string): Promise<{
    transactionId: string;
    hashscanUrl: string;
  }> {
    try {
      // Convert transcript to string for HCS submission
      const messageString = typeof transcript === 'string' 
        ? transcript 
        : JSON.stringify(transcript);
      
      this.logger.log(`Submitting to HCS - Topic: ${topicId}, Message length: ${messageString.length} chars`);
      
      const response = await axios.post(
        `${this.baseUrl}/hcs/message`,
        {
          topicId,
          message: messageString  // LLM-processed JSON or fallback string
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          }
        }
      );

      const result = response.data;
      this.logger.log(`HCS Response: ${JSON.stringify(result)}`);
      
      // Fix HashScan URL - use the correct field from HCS response  
      const transactionId = result.transactionId || result.topicSequenceNumber || 'unknown';
      const hashscanUrl = `https://hashscan.io/testnet/topic/${topicId}/message`;
      
      return {
        transactionId,
        hashscanUrl
      };
    } catch (error) {
      this.logger.error(`HTTP request to /hcs/message failed: ${error.message}`);
      throw error;
    }
  }



  async getTranscriptStatus(sessionId: string): Promise<{
    submitted: boolean;
    messageCount: number;
    submissionDate?: Date;
    storedInDatabase?: boolean;
    submittedToHcs?: boolean;
    hcsTransactionId?: string;
    hashscanUrl?: string;
  }> {
    const session = await this.agentChatService.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Check if transcript is stored in database
    const storedTranscript = await this.transcriptModel.findOne({ sessionId }).exec();

    return {
      submitted: session.transcriptSubmitted,
      messageCount: session.messageCount,
      submissionDate: session.endedAt,
      storedInDatabase: !!storedTranscript,
      submittedToHcs: storedTranscript?.submittedToHcs || false,
      hcsTransactionId: storedTranscript?.hcsTransactionId,
      hashscanUrl: storedTranscript?.hashscanUrl
    };
  }

  async getStoredTranscript(sessionId: string): Promise<SessionTranscript | null> {
    return this.transcriptModel.findOne({ sessionId }).exec();
  }

  private async processTranscriptWithLLM(transcript: any): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    // Validate transcript structure
    if (!transcript.conversation || !Array.isArray(transcript.conversation)) {
      throw new Error('Invalid transcript structure - no conversation array found');
    }

    if (transcript.conversation.length === 0) {
      throw new Error('Empty conversation - nothing to process');
    }

    const { sessionInfo } = transcript;
    
    // Create prompt for LLM to process the transcript
    const prompt = `Format this agent conversation transcript into a clean, structured JSON for blockchain storage. DO NOT summarize or alter the messages - keep all original message content exactly as is.

ORIGINAL TRANSCRIPT:
${JSON.stringify(transcript, null, 2)}

Please create a JSON response with:
1. Session metadata (sessionId, agent names, timestamps, messageCount) once.
2. Clean conversation format showing each message as "agentName: exact message content"
3. Preserve ALL original messages between agents word-for-word
4. Include original metadata (AI model, tokens, processing time) if present 

Format the conversation section as:
"conversation": [
  "agentA: first message here",
  "agentB: response message here", 
  "agentA: next message here"
]

Keep everything exactly as written - just reorganize for clean presentation. Return only valid JSON.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a transcript formatter. Restructure conversation transcripts into clean, readable JSON format for blockchain storage. NEVER summarize, alter, or change the original messages - only reorganize them into a better format. Always return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const llmResponse = response.choices[0]?.message?.content;
      if (!llmResponse) {
        throw new Error('No response from LLM');
      }

      // Parse and validate the JSON response
      const processedTranscript = JSON.parse(llmResponse);
      
      // Add original session ID for reference
      processedTranscript.originalSessionId = sessionInfo.sessionId;
      processedTranscript.processedAt = new Date().toISOString();
      processedTranscript.processingMethod = 'llm-gpt4-mini';

      return processedTranscript;

    } catch (error) {
      this.logger.error(`LLM processing failed: ${error.message}`);
      throw error;
    }
  }

  // Legacy method - keep for backward compatibility
  private formatTranscriptForBlockchain(transcript: any): string {
    // Fallback to JSON string if LLM processing fails
    return JSON.stringify(transcript, null, 2);
  }
}