export interface WebSocketMessage<T = any> {
  event: string;
  channel?: string;
  data: T;
  timestamp?: string;
}

export interface WebSocketSubscription {
  channel: string;
  clientId: string;
}

export interface WebSocketBroadcast extends WebSocketMessage {
  recipients?: string[];
}
