import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SubscribeService } from './subscribe/subscribe.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class HcsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(HcsGateway.name);

  constructor(private readonly subscribeService: SubscribeService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Subscribe to HCS topic and broadcast messages to connected clients
  async subscribeToHcsTopic(topicId: string) {
    this.logger.log(`Subscribing to HCS topic: ${topicId}`);
    await this.subscribeService.subscribeToTopic(topicId, (message) => {
      this.logger.log(`Broadcasting HCS message: ${message}`);
      this.server.emit('hcsMessage', {
        topicId,
        message,
        timestamp: new Date().toISOString()
      });
    });
  }
}
