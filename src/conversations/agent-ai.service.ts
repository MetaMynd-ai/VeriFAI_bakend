import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionMessage } from './entities/session-message.entity';
import { AgentProfileService } from '../agent-profile/agent-profile.service';
import OpenAI from 'openai';

@Injectable()
export class AgentAIService {
  private readonly logger = new Logger(AgentAIService.name);
  private readonly openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private agentProfileService: AgentProfileService,
  ) {
    const apiKey = this.configService.get<string>('openAI.apiKey');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async generateResponse(
    agentAccountId: string, 
    conversation: SessionMessage[], 
    lastMessage: string,
    conversationContext?: any
  ): Promise<{ response: string; metadata: any }> {
    try {
      // Check if the last message was from the same agent (prevent loops)
      if (conversation.length > 0 && conversation[conversation.length - 1].fromAgentId === agentAccountId) {
        throw new BadRequestException('Cannot respond to own message to prevent loops');
      }

      // 1. Get agent profile
      const profile = await this.agentProfileService.findByAgentAccountId(agentAccountId);
      if (!profile) {
        throw new BadRequestException(`Agent ${agentAccountId} not found`);
      }

      // 2. Build enhanced system prompt with conversation context
      const systemPrompt = this.buildEnhancedAgentPrompt(profile, conversation, conversationContext);

      // 3. Format conversation for AI with role-specific context
      const messages = this.formatConversationForAI(conversation, lastMessage, systemPrompt);

      // 4. Generate response using OpenAI
      const startTime = Date.now();
      const response = await this.callOpenAI(messages);
      const processingTime = Date.now() - startTime;

      // 5. Analyze response for actions and context
      const responseAnalysis = this.analyzeResponseForActions(response.content, profile);

      return {
        response: response.content,
        metadata: {
          aiModel: this.configService.get<string>('openAI.model'),
          aiProvider: 'openai',
          processingTime,
          tokensUsed: response.tokensUsed,
          ...responseAnalysis
        }
      };

    } catch (error) {
      this.logger.error(`Error generating AI response for agent ${agentAccountId}:`, error);
      
      // Generate context-aware fallback response
      const fallbackResponse = this.generateFallbackResponse(error, agentAccountId);
      
      return {
        response: fallbackResponse,
        metadata: {
          error: error.message,
          processingTime: 0,
          aiProvider: 'error'
        }
      };
    }
  }

  async getAgentAIConfig(agentAccountId: string): Promise<{
    hasApiKey: boolean;
    aiProvider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  }> {
    // Always return the global OpenAI configuration
    return {
      hasApiKey: !!this.configService.get<string>('openAI.apiKey'),
      aiProvider: 'openai',
      model: this.configService.get<string>('openAI.model'),
      temperature: this.configService.get<number>('openAI.temperature'),
      maxTokens: this.configService.get<number>('openAI.maxTokens')
    };
  }

  private buildAgentPrompt(profile: any): string {
    const capabilities = profile.capability?.join(', ') || 'general conversation';
    
    return `You are ${profile.agentName}, an AI agent with the following characteristics:

Agent Type: ${profile.agentType}
Category: ${profile.agentCategory}
Account ID: ${profile.agentAccountId}
Name: ${profile.agentName}
Description: ${profile.agentDescription}
Purpose: ${profile.purpose}
Capabilities: ${capabilities}

Personality Guidelines:
- Embody your agent type (${profile.agentType}) in all responses
- Focus on your specialized category (${profile.agentCategory})
- Your purpose is: ${profile.purpose}
- Leverage your capabilities: ${capabilities}
- Stay true to your character and specialization
- Be helpful and engage naturally in conversation
- Keep responses concise but meaningful (max 200 words)
- If asked about something outside your expertise, acknowledge your limitations politely
- Stop responding if the previous message is from yourself or if no new information is provided

Context: You are having a conversation with another AI agent. Stay in character and respond naturally based on these defined traits.`;
  }

  private buildEnhancedAgentPrompt(profile: any, conversation: SessionMessage[], context?: any): string {
    const capabilities = profile.capability?.join(', ') || 'general conversation';
    const conversationSummary = this.summarizeConversation(conversation);
    const roleSpecificInstructions = this.getRoleSpecificInstructions(profile.agentCategory);
    
    return `You are ${profile.agentName}, an AI agent with the following characteristics:

Agent Type: ${profile.agentType}
Category: ${profile.agentCategory}
Account ID: ${profile.agentAccountId}
Name: ${profile.agentName}
Description: ${profile.agentDescription}
Purpose: ${profile.purpose}
Capabilities: ${capabilities}

CONVERSATION CONTEXT:
${conversationSummary}

ROLE-SPECIFIC INSTRUCTIONS:
${roleSpecificInstructions}

GENERAL GUIDELINES:
- Embody your agent type (${profile.agentType}) in all responses
- Focus on your specialized category (${profile.agentCategory})
- Your purpose is: ${profile.purpose}
- Leverage your capabilities: ${capabilities}
- Stay true to your character and specialization
- Be helpful and engage naturally in conversation
- Keep responses concise but meaningful (max 300 words)
- Ask follow-up questions to gather missing information when needed
- If you can take actions, suggest them clearly
- If asked about something outside your expertise, acknowledge your limitations politely

CURRENT CONTEXT: You are having a conversation with another agent. Use the conversation history to provide contextually relevant responses.`;
  }

  private summarizeConversation(conversation: SessionMessage[]): string {
    if (conversation.length === 0) return "No previous conversation.";
    
    const recentMessages = conversation.slice(-5); // Last 5 messages for context
    const summary = recentMessages.map(msg => 
      `${msg.fromAgentId}: ${msg.message.substring(0, 100)}${msg.message.length > 100 ? '...' : ''}`
    ).join('\n');
    
    return `Recent conversation:\n${summary}`;
  }

  private getRoleSpecificInstructions(category: string): string {
    const roleInstructions = {
      'travel': `
- Ask for specific travel details: destinations, dates, budget, preferences
- Provide SPECIFIC travel options with prices, times, and details
- When you say "I'll search for options", immediately provide 2-3 actual examples
- Include flight numbers, prices, and booking recommendations in the same response
- Provide helpful travel tips and recommendations
- Ask clarifying questions if information is missing
- Be proactive in offering complete travel solutions, not just promises to search`,
      
      'customer-service': `
- Be helpful, patient, and professional
- Ask for details to better understand the issue
- Provide step-by-step solutions
- Escalate complex issues when appropriate
- Follow up to ensure satisfaction`,
      
      'personal-assistant': `
- Be proactive in organizing and planning
- Ask for preferences and constraints
- Provide detailed options and recommendations
- Help prioritize tasks and manage time
- Anticipate needs and offer suggestions`,
      
      'technical': `
- Ask for specific technical details and error messages
- Provide step-by-step technical solutions
- Explain concepts clearly for the user's level
- Suggest best practices and alternatives
- Request more information when diagnosis is unclear`,
      
      'sales': `
- Understand customer needs and pain points
- Present relevant solutions and benefits
- Ask qualifying questions to understand budget and timeline
- Address objections professionally
- Guide towards appropriate next steps`
    };

    return roleInstructions[category.toLowerCase()] || `
- Be helpful and professional in your area of expertise
- Ask clarifying questions when needed
- Provide relevant information and suggestions
- Stay within your role boundaries`;
  }

  private analyzeResponseForActions(response: string, profile: any): any {
    const analysis = {
      containsQuestion: response.includes('?'),
      suggestsAction: false,
      requestsInformation: false,
      agentRole: profile.agentCategory,
      responseType: 'informational'
    };

    // Check for action suggestions
    const actionKeywords = ['book', 'schedule', 'arrange', 'create', 'setup', 'configure', 'install'];
    analysis.suggestsAction = actionKeywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );

    // Check for information requests
    const infoRequestKeywords = ['tell me', 'what is', 'how much', 'when', 'where', 'which'];
    analysis.requestsInformation = infoRequestKeywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );

    // Determine response type
    if (analysis.containsQuestion && analysis.requestsInformation) {
      analysis.responseType = 'information_request';
    } else if (analysis.suggestsAction) {
      analysis.responseType = 'action_suggestion';
    } else if (analysis.containsQuestion) {
      analysis.responseType = 'clarification';
    }

    return analysis;
  }

  private generateFallbackResponse(error: any, agentAccountId: string): string {
    const fallbackResponses = {
      'travel': "I'm having trouble accessing my travel database right now. Could you please repeat your travel request?",
      'customer-service': "I'm experiencing technical difficulties. Let me try to help you in a moment, or you can contact our support team directly.",
      'technical': "I'm encountering a system error. Please provide more details about your technical issue, and I'll do my best to help.",
      'default': "I'm having trouble responding right now. Could you please try again or rephrase your question?"
    };

    // Try to get a role-specific fallback, otherwise use default
    return fallbackResponses['default'];
  }


  private formatConversationForAI(
    conversation: SessionMessage[], 
    lastMessage: string, 
    systemPrompt: string
  ): any[] {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (all messages for full context)
    conversation.forEach(msg => {
      messages.push({
        role: 'user',
        content: `Agent ${msg.fromAgentId}: ${msg.message}`
      });
    });

    // Add the triggering message
    if (lastMessage) {
      messages.push({ 
        role: 'user', 
        content: lastMessage 
      });
    }

    return messages;
  }

  private async callOpenAI(messages: any[]): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model: this.configService.get<string>('openAI.model'),
      messages,
      max_tokens: this.configService.get<number>('openAI.maxTokens'),
      temperature: this.configService.get<number>('openAI.temperature'),
    });

    return {
      content: response.choices[0]?.message?.content || "I couldn't generate a response.",
      tokensUsed: response.usage?.total_tokens
    };
  }

}