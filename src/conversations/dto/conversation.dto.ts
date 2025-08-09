import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'Array of participant IDs' })
  @IsArray()
  @IsString({ each: true })
  participants: string[];

  @ApiProperty({ description: 'Communication topic ID' })
  @IsString()
  communicationTopicId: string;

  @ApiProperty({ description: 'Owner DID', required: false })
  @IsOptional()
  @IsString()
  ownerDid?: string;

  @ApiProperty({ description: 'Conversation metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class AddMessageDto {
  @ApiProperty({ description: 'From agent ID' })
  @IsString()
  fromAgentId: string;

  @ApiProperty({ description: 'To agent ID' })
  @IsString()
  toAgentId: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Whether message is AI generated', required: false })
  @IsOptional()
  @IsBoolean()
  isAIGenerated?: boolean;

  @ApiProperty({ description: 'Message metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class CreateAgentChatSessionDto {
  @ApiProperty({ description: 'First agent account ID', default: '0.0.6154098' })
  @IsString()
  agent1AccountId: string = '0.0.6154098';

  @ApiProperty({ description: 'Second agent account ID', default: '0.0.6153500' })
  @IsString()
  agent2AccountId: string = '0.0.6153500';

  @ApiProperty({ 
    description: 'Which agent\'s communicationTopicId to use for blockchain transcript submission', 
    enum: ['agent1', 'agent2'],
    default: 'agent1',
    required: false 
  })
  @IsOptional()
  @IsString()
  preferredTopicAgent?: 'agent1' | 'agent2' = 'agent1';
}

export class SetAgentAIConfigDto {
  @ApiProperty({ description: 'AI API key' })
  @IsString()
  apiKey: string;

  @ApiProperty({ description: 'AI provider', enum: ['openai', 'claude', 'gemini'] })
  @IsString()
  aiProvider: 'openai' | 'claude' | 'gemini';

  @ApiProperty({ description: 'Provider configuration', required: false })
  @IsOptional()
  @IsObject()
  providerConfig?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}