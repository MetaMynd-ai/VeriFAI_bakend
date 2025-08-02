import { Injectable, Logger } from '@nestjs/common';
import { WebSocketMessage, WebSocketBroadcast } from './interfaces/websocket.interface';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private subscriptions = new Map<string, Set<string>>();

  constructor() {}

  async broadcast<T>(event: string, data: T): Promise<WebSocketMessage<T>> {
    this.logger.debug(`Broadcasting event: ${event}, data: ${JSON.stringify(data)}`);
    return {
      event,
      data,
      timestamp: new Date().toISOString()
    };
  }

  async subscribe(clientId: string, channel: string) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel).add(clientId);
    this.logger.debug(`Client ${clientId} subscribed to channel ${channel}`);
  }

  async unsubscribe(clientId: string, channel: string) {
    if (this.subscriptions.has(channel)) {
      this.subscriptions.get(channel).delete(clientId);
      this.logger.debug(`Client ${clientId} unsubscribed from channel ${channel}`);
    }
  }

  async unsubscribeAll(clientId: string) {
    for (const [channel, clients] of this.subscriptions.entries()) {
      if (clients.has(clientId)) {
        clients.delete(clientId);
        this.logger.debug(`Client ${clientId} unsubscribed from channel ${channel}`);
      }
    }
  }

  getSubscribers(channel: string): string[] {
    return Array.from(this.subscriptions.get(channel) || []);
  }
}
