import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { AgentChatService } from './agent-chat.service';
import { AgentAIService } from './agent-ai.service';
import { TranscriptService, SessionTranscript, SessionTranscriptSchema } from './transcript.service';
import { AgentChatController } from './agent-chat.controller';
import { AgentChatGateway } from './agent-chat.gateway';

// Entity imports
import { Conversation, ConversationSchema } from './entities/conversation.entity';
import { ConversationMessage, ConversationMessageSchema } from './entities/conversation-message.entity';
import { AgentChatSession, AgentChatSessionSchema } from './entities/agent-chat-session.entity';
import { SessionMessage, SessionMessageSchema } from './entities/session-message.entity';

// External module imports
import { AgentProfileModule } from '../agent-profile/agent-profile.module';
import { AuthModule } from '../auth/auth.module';
import { HcsModule } from '../hcs/hcs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: ConversationMessage.name, schema: ConversationMessageSchema },
      { name: AgentChatSession.name, schema: AgentChatSessionSchema },
      { name: SessionMessage.name, schema: SessionMessageSchema },
      { name: SessionTranscript.name, schema: SessionTranscriptSchema },
    ]),
    AgentProfileModule,
    AuthModule,
    HcsModule,
  ],
  controllers: [
    ConversationController,
    AgentChatController,
  ],
  providers: [
    ConversationService,
    AgentChatService,
    AgentAIService,
    TranscriptService,
    AgentChatGateway,
  ],
  exports: [
    ConversationService,
    AgentChatService,
    AgentAIService,
    TranscriptService,
  ],
})
export class ConversationModule {}