import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';

@Module({
  imports: [],
  providers: [WebsocketGateway, WebSocketService],
  exports: [WebSocketService]
})
export class WebSocketModule {}
