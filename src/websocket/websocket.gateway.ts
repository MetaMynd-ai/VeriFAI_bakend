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
  namespace: '/events',
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  allowUpgrades: true
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
    client.join(channel);
    this.logger.log(`Client ${client.id} subscribed to channel ${channel}`);
    return { event: 'subscribed', data: { channel } };
  }

  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(client: Socket, channel: string) {
    await this.webSocketService.unsubscribe(client.id, channel);
    client.leave(channel);
    this.logger.log(`Client ${client.id} unsubscribed from channel ${channel}`);
    return { event: 'unsubscribed', data: { channel } };
  }

  @SubscribeMessage('hcsMessage')
  async handleMessage(client: Socket, message: WebSocketMessage) {
    this.logger.log(`Received message from ${client.id} in channel ${message.channel}`);
    
    if (message.channel) {
      // Broadcast to the specific channel
      this.server.to(message.channel).emit('hcsMessage', {
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      });
    } else {
      // Broadcast to all clients if no channel specified
      this.server.emit('hcsMessage', {
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      });
    }
    
    return { event: 'messageSent', data: message };
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
