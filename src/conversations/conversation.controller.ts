import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConversationService } from './conversation.service';
import { CreateConversationDto, AddMessageDto } from './dto/conversation.dto';

@ApiTags('Conversations')
@Controller('api/conversations')
@ApiBearerAuth('Bearer')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  async createConversation(@Body() createConversationDto: CreateConversationDto) {
    try {
      const conversation = await this.conversationService.createConversation(
        createConversationDto.participants,
        createConversationDto.communicationTopicId,
        createConversationDto.ownerDid,
        createConversationDto.metadata
      );

      return {
        success: true,
        data: conversation
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create conversation',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
  async getConversation(@Param('id') id: string) {
    try {
      const conversation = await this.conversationService.getConversationWithMessages(id);
      
      if (!conversation) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: conversation
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get conversation',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':id/messages')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Add message to conversation' })
  @ApiBody({ type: AddMessageDto })
  @ApiResponse({ status: 201, description: 'Message added successfully' })
  async addMessage(
    @Param('id') conversationId: string,
    @Body() addMessageDto: AddMessageDto
  ) {
    try {
      const message = await this.conversationService.addMessage(
        conversationId,
        addMessageDto.fromAgentId,
        addMessageDto.toAgentId,
        addMessageDto.message,
        addMessageDto.isAIGenerated,
        addMessageDto.metadata
      );

      return {
        success: true,
        data: message
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add message',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id/messages')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get conversation messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getMessages(@Param('id') conversationId: string) {
    try {
      const messages = await this.conversationService.getConversationMessages(conversationId);

      return {
        success: true,
        data: messages,
        count: messages.length
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get messages',
        HttpStatus.BAD_REQUEST
      );
    }
  }
}