import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { HcsService } from './hcs.service';

@ApiTags('hcs')
@Controller('hcs')
export class HcsController {
  constructor(private readonly hcsService: HcsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get HCS module status' })
  @ApiOkResponse({ description: 'Returns HCS module status.' })
  getStatus() {
    return { status: 'HCS module is active' };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Hedera HCS topic' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        memo: { type: 'string' }
      },
      example: { memo: 'My AI Agent Topic' }
    }
  })
  @ApiOkResponse({ description: 'Returns the new topic ID.' })
  async createTopic(@Body() body: { memo?: string }) {
    return this.hcsService.createHcsTopic(body.memo);
  }

  @Post('message')
  @ApiOperation({ summary: 'Write a message to a Hedera HCS topic' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topicId: { type: 'string' },
        message: { type: 'string' }
      },
      required: ['topicId', 'message'],
      example: {
        topicId: '0.0.123456',
        message: 'Hello from my AI agent!'
      }
    }
  })
  @ApiOkResponse({ description: 'Returns the transaction status or message receipt.' })
  async writeMessage(@Body() body: { topicId: string; message: string }) {
    console.log('Writing message to topic:', body.topicId, 'Message:', body.message);
    return this.hcsService.writeMessageToTopic(body.topicId, body.message);
  }

  @Post('agent/register')
  @ApiOperation({ summary: 'Register an agent (HCS2) by submitting a message to the agent registry topic' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        agentDID: { type: 'string', description: 'Unique agent identifier (DID or UUID)' },
        profileTopicId: { type: 'string', description: 'HCS10 profile topic ID for the agent' },
        ownerDid: { type: 'string', description: 'DID of the agent owner' },
        credentialId: { type: 'string', description: 'Credential/NFT ID for the agent' },
        status: { type: 'string', description: 'Agent status (active, suspended, etc.)' },
        timestamp: { type: 'string', description: 'ISO timestamp' }
      },
      required: ['agentId', 'profileTopicId', 'ownerDid', 'credentialId', 'status', 'timestamp'],
      example: {
        agentDID: 'did:hedera:testnet:agent:123',
        profileTopicId: '0.0.7000001',
        ownerDid: 'did:hedera:testnet:user:456',
        credentialId: '0.0.6009502:123',
        status: 'active',
        timestamp: '2025-05-30T12:00:00Z'
      }
    }
  })
  @ApiOkResponse({ description: 'Returns the transaction status or message receipt.' })
  async registerAgent(@Body() body: any) {
    
    return this.hcsService.writeMessageToTopic("register", JSON.stringify(body));
  }
}
