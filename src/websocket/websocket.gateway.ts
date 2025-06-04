import { 
  WebSocketGateway as NestWebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayInit, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebSocketService } from './websocket.service';
import { WebSocketMessage } from './interfaces/websocket.interface';

@NestWebSocketGateway({
  cors: {
    origin: '*',
    credentials: true
  },
  namespace: '/events'
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(private readonly webSocketService: WebSocketService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.webSocketService.unsubscribeAll(client.id);
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(client: Socket, channel: string) {
    await this.webSocketService.subscribe(client.id, channel);
    return { event: 'subscribed', data: { channel } };
  }

  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(client: Socket, channel: string) {
    await this.webSocketService.unsubscribe(client.id, channel);
    return { event: 'unsubscribed', data: { channel } };
  }

  async broadcastToChannel(channel: string, event: string, data: any) {
    const subscribers = this.webSocketService.getSubscribers(channel);
    for (const clientId of subscribers) {
      this.server.to(clientId).emit(event, {
        channel,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }
}
