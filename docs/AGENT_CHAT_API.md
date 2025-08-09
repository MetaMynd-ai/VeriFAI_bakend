# Agent Chat WebSocket API Documentation

## Overview

This document outlines the WebSocket API for real-time agent-to-agent chat functionality. The system supports intelligent AI conversations between two agents with enhanced features like message streaming, user-on-behalf messaging, and spam-free conversation history loading.

## Base Configuration

```typescript
const socket = io('http://localhost:4001/agent-chat', {
  transports: ['websocket', 'polling'],
  timeout: 10000
});
```

---

## WebSocket Events

### 📥 **Client → Server Events**

#### 1. `agent-join-session`
Joins an agent to a chat session. **Automatically sends conversation history once per client.**

**Payload:**
```typescript
{
  sessionId: string;      // The chat session ID
  agentAccountId: string; // Agent's Hedera account ID
}
```

**Example:**
```typescript
socket.emit('agent-join-session', {
  sessionId: 'session-uuid-here',
  agentAccountId: '0.0.6154098'
});
```

**Server Responses:**
- `session-info` - Session join confirmation
- `conversation-history` - Historical messages (sent **once per client**)
- `error` - Join failed

---

#### 2. `user-send-message-on-behalf`
**NEW**: Allows a user to send a message on behalf of Agent1, optionally triggering Agent2's AI response.

**Payload:**
```typescript
{
  sessionId: string;    // The chat session ID
  agentId: string;      // Agent account ID to send on behalf of
  message: string;      // The message content
  triggerAI?: boolean;  // Optional: Auto-trigger other agent's AI (default: false)
}
```

**Example:**
```typescript
// Send user message as Agent1 and trigger Agent2 AI response
socket.emit('user-send-message-on-behalf', {
  sessionId: 'session-uuid',
  agentId: '0.0.6154098',
  message: 'I want to plan a trip to Paris for 5 days',
  triggerAI: true
});
```

**Server Responses:**
- `message-sent-on-behalf` - Confirmation
- `new-message` - Message broadcasted to session
- `ai-response-generated` - AI response (if triggerAI: true)
- `error` - Send failed

---

#### 3. `agent-send-message`
Standard agent-to-agent message sending (for AI agents).

**Payload:**
```typescript
{
  sessionId: string;
  fromAgentId: string;
  message: string;
}
```

**Server Responses:**
- `new-message` - Message broadcasted to session
- `error` - Send failed

---

#### 4. `trigger-ai-response`
Manually trigger an AI agent to generate a response.

**Payload:**
```typescript
{
  sessionId: string;
  agentAccountId: string; // Which agent should generate AI response
}
```

**Example:**
```typescript
socket.emit('trigger-ai-response', {
  sessionId: 'session-uuid',
  agentAccountId: '0.0.6153500' // Agent2
});
```

**Server Responses:**
- `ai-thinking` - AI is processing
- `ai-response-generated` - AI response ready
- `ai-skip` - AI skipped (loop prevention)
- `error` - AI generation failed

---

#### 5. `get-conversation-history`
**NEW**: Explicitly request conversation history with spam prevention.

**Payload:**
```typescript
{
  sessionId: string;
  force?: boolean; // Force resend even if already sent (default: false)
}
```

**Example:**
```typescript
socket.emit('get-conversation-history', {
  sessionId: 'session-uuid',
  force: false
});
```

**Server Responses:**
- `conversation-history` - Messages array
- `conversation-history-cached` - Already sent to this client
- `error` - Request failed

---

#### 6. `stream-conversation-messages`
**NEW**: Load messages one-by-one with pagination support.

**Payload:**
```typescript
{
  sessionId: string;
  startIndex?: number;  // Start from message index (default: 0)
  batchSize?: number;   // Number of messages per batch (default: 10)
}
```

**Example:**
```typescript
socket.emit('stream-conversation-messages', {
  sessionId: 'session-uuid',
  startIndex: 0,
  batchSize: 10
});
```

**Server Responses:**
- `message-stream` - Individual messages
- `message-stream-complete` - Batch completion info
- `error` - Stream failed

---

#### 7. `get-session-status`
Get current session information.

**Payload:**
```typescript
{
  sessionId: string;
}
```

**Server Responses:**
- `session-status` - Session details
- `error` - Status request failed

---

#### 8. `end-session`
End the current chat session and generate transcript.

**Payload:**
```typescript
{
  sessionId: string;
}
```

**Server Responses:**
- `session-ended` - Session terminated
- `error` - End session failed

---

### 📤 **Server → Client Events**

#### 1. `session-info`
Confirmation of successful session join.

**Data:**
```typescript
{
  sessionId: string;
  otherAgentId: string;  // The other agent in the session
  messageCount: number;  // Current message count
}
```

---

#### 2. `conversation-history`
Historical messages (sent **once per client** to prevent spam).

**Data:**
```typescript
Array<{
  from: string;         // Agent account ID
  message: string;      // Message content
  timestamp: Date;      // When message was sent
  metadata?: any;       // Additional message metadata
}>
```

**Example:**
```typescript
socket.on('conversation-history', (messages) => {
  console.log(`Loaded ${messages.length} historical messages`);
  messages.forEach(msg => {
    displayMessage(msg.from, msg.message, msg.timestamp);
  });
});
```

---

#### 3. `conversation-history-cached`
**NEW**: Indicates history was already sent to prevent duplicate loading.

**Data:**
```typescript
{
  message: string; // "Conversation history already sent to this client"
}
```

---

#### 4. `new-message`
Real-time message broadcast to all session participants.

**Data:**
```typescript
{
  from: string;         // Sender agent ID
  message: string;      // Message content
  timestamp: Date;      // Send timestamp
  metadata?: {          // Optional metadata
    sentBy?: 'user' | 'ai';
    onBehalfOf?: string;
  }
}
```

---

#### 5. `ai-thinking`
Indicates an AI agent is generating a response.

**Data:**
```typescript
{
  agentId: string; // Which agent is thinking
}
```

---

#### 6. `ai-response-generated`
AI agent has generated a response with enhanced metadata.

**Data:**
```typescript
{
  from: string;         // Agent ID who generated response
  message: string;      // AI response content
  timestamp: Date;      // Response timestamp
  metadata: {
    aiModel: string;           // 'gpt-3.5-turbo', etc.
    aiProvider: string;        // 'openai'
    processingTime: number;    // MS to generate
    tokensUsed: number;        // Tokens consumed
    containsQuestion: boolean; // Response asks a question
    suggestsAction: boolean;   // Response suggests action
    requestsInformation: boolean; // Response requests info
    agentRole: string;         // 'travel', 'customer-service', etc.
    responseType: 'informational' | 'information_request' | 'action_suggestion' | 'clarification';
  }
}
```

**Example:**
```typescript
socket.on('ai-response-generated', (data) => {
  displayMessage(data.from + ' 🤖', data.message);
  
  // Use metadata for UI enhancements
  if (data.metadata.containsQuestion) {
    highlightAsQuestion();
  }
  if (data.metadata.suggestsAction) {
    showActionButtons();
  }
});
```

---

#### 7. `ai-skip`
AI agent skipped response (loop prevention or other reason).

**Data:**
```typescript
{
  agentId: string; // Agent that skipped
  reason: string;  // 'loop-prevention', etc.
}
```

---

#### 8. `message-stream`
**NEW**: Individual message during streaming.

**Data:**
```typescript
{
  from: string;
  message: string;
  timestamp: Date;
  metadata?: any;
  index: number;        // Message index in conversation
  isLast: boolean;      // Is this the final message
}
```

**Example:**
```typescript
socket.on('message-stream', (message) => {
  displayMessage(message.from, message.message);
  if (message.isLast) {
    console.log('Last message in stream');
  }
});
```

---

#### 9. `message-stream-complete`
**NEW**: Streaming batch completion information.

**Data:**
```typescript
{
  totalMessages: number;    // Total messages in conversation
  sentCount: number;        // Messages sent in this batch
  nextStartIndex: number;   // Next batch start index
  hasMore: boolean;         // More messages available
}
```

---

#### 10. `message-sent-on-behalf`
**NEW**: Confirmation that user message was sent on behalf of agent.

**Data:**
```typescript
{
  sessionId: string;
  agentId: string;    // Agent message was sent on behalf of
  success: boolean;   // Send success status
}
```

---

#### 11. `session-status`
Current session information.

**Data:**
```typescript
{
  sessionId: string;
  status: 'active' | 'ended';
  messageCount: number;
  startTime: Date;
  endTime?: Date;
  transcriptSubmitted: boolean;
}
```

---

#### 12. `session-ended`
Session has been terminated.

**Data:**
```typescript
{
  sessionId: string;
  transcriptSubmitted: boolean; // Transcript saved to blockchain
}
```

---

#### 13. `agent-joined`
Another agent joined the session.

**Data:**
```typescript
{
  agentId: string; // Agent that joined
}
```

---

#### 14. `error`
Error occurred during any operation.

**Data:**
```typescript
{
  message: string;  // Error description
  code: string;     // Error code: 'JOIN_ERROR', 'MESSAGE_ERROR', 'AI_TRIGGER_ERROR', etc.
}
```

---

## 🌐 **REST API Endpoints**

### **End Session + Submit Transcript (One Shot)**

**Endpoint:** `DELETE /api/agent-chat/sessions/{sessionId}`  
**Auth:** Required (JWT Bearer token)

Ends the chat session and automatically submits the transcript to Hedera blockchain in one operation.

**Example:**
```typescript
const response = await fetch(`/api/agent-chat/sessions/${sessionId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
```

**Response:**
```typescript
{
  success: boolean,
  data: {
    sessionId: string,
    ended: boolean,                      // Session ended successfully
    transcriptSubmitted: boolean,        // Transcript submitted to blockchain
    transcriptTransactions: Array<{      // Hedera transaction details (if submitted)
      hashscanUrl: string,              // HashScan URL for verification
      transactionId: string             // Hedera transaction ID
    }>
  }
}
```

**Error Response:**
```typescript
{
  success: false,
  message: string,  // Error description
  status: number    // HTTP status code
}
```

**Notes:**
- ✅ **Automatically submits transcript** to Hedera blockchain
- ✅ **Graceful failure**: Session ends even if transcript submission fails
- ✅ **Returns transaction details** for blockchain verification
- ✅ **Access control**: Only session owner can end session

---

## 🚀 **Complete Angular Service Example**

```typescript
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';

interface ChatMessage {
  from: string;
  message: string;
  timestamp: Date;
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AgentChatService {
  private socket: Socket;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private currentSessionId: string;

  constructor() {
    this.socket = io('http://localhost:4001/agent-chat', {
      transports: ['websocket', 'polling'],
      timeout: 10000
    });
    this.setupEventListeners();
  }

  // Connect to session (spam-free history loading)
  joinSession(sessionId: string, agentAccountId: string): void {
    this.currentSessionId = sessionId;
    this.socket.emit('agent-join-session', {
      sessionId,
      agentAccountId
    });
  }

  // Send message on behalf of Agent1, optionally trigger Agent2 AI
  sendUserMessage(message: string, agentId: string, triggerAI = true): void {
    this.socket.emit('user-send-message-on-behalf', {
      sessionId: this.currentSessionId,
      agentId,
      message,
      triggerAI
    });
  }

  // Manually trigger AI response
  triggerAIResponse(agentAccountId: string): void {
    this.socket.emit('trigger-ai-response', {
      sessionId: this.currentSessionId,
      agentAccountId
    });
  }

  // Get messages observable
  getMessages(): Observable<ChatMessage[]> {
    return this.messagesSubject.asObservable();
  }

  // Stream messages one-by-one (alternative to bulk loading)
  streamMessages(startIndex = 0, batchSize = 10): void {
    this.socket.emit('stream-conversation-messages', {
      sessionId: this.currentSessionId,
      startIndex,
      batchSize
    });
  }

  private setupEventListeners(): void {
    // Spam-free conversation history (loads once)
    this.socket.on('conversation-history', (messages: ChatMessage[]) => {
      console.log(`Loaded ${messages.length} historical messages`);
      this.messagesSubject.next(messages);
    });

    // Real-time new messages
    this.socket.on('new-message', (message: ChatMessage) => {
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, message]);
    });

    // Enhanced AI responses with metadata
    this.socket.on('ai-response-generated', (data: any) => {
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, data]);
      
      // Handle AI metadata for UI enhancements
      if (data.metadata.containsQuestion) {
        console.log('AI is asking a question');
      }
      if (data.metadata.suggestsAction) {
        console.log('AI suggests taking action');
      }
    });

    // AI thinking indicator
    this.socket.on('ai-thinking', (data) => {
      console.log(`Agent ${data.agentId} is generating response...`);
    });

    // Stream individual messages
    this.socket.on('message-stream', (message: ChatMessage) => {
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, message]);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Chat error:', error.message, error.code);
    });
  }

  // End session and submit transcript (REST API - one shot)
  async endSessionWithTranscript(sessionId: string, jwtToken: string): Promise<any> {
    const response = await fetch(`http://localhost:4001/api/agent-chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return await response.json();
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
```

---

## 🎯 **Usage Patterns**

### **Pattern 1: User ↔ Travel Agent Chat**
```typescript
// 1. Join session
chatService.joinSession(sessionId, agent1Id);

// 2. User asks travel question on behalf of Agent1
chatService.sendUserMessage(
  "I want to visit Japan for 10 days", 
  agent1Id, 
  true  // Auto-trigger Agent2 (travel agent) response
);

// 3. Agent2 AI responds with questions and suggestions
// "What's your budget? I can suggest itineraries and help with bookings!"
```

### **Pattern 2: Streaming Messages for Better UX**
```typescript
// Load messages one-by-one instead of bulk
chatService.streamMessages(0, 10);

// Messages appear individually in UI
chatService.getMessages().subscribe(messages => {
  // Display each message as it arrives
});
```

### **Pattern 3: Manual AI Control**
```typescript
// Send message without auto-trigger
chatService.sendUserMessage("Hello", agent1Id, false);

// Manually trigger AI when needed
chatService.triggerAIResponse(agent2Id);
```

---

## 🐛 **Error Handling**

All operations can fail. Always handle errors:

```typescript
socket.on('error', (error) => {
  switch (error.code) {
    case 'JOIN_ERROR':
      // Failed to join session
      break;
    case 'MESSAGE_ERROR':
      // Message sending failed
      break;
    case 'AI_TRIGGER_ERROR':
      // AI generation failed
      break;
    case 'HISTORY_ERROR':
      // History loading failed
      break;
    default:
      console.error('Unknown error:', error.message);
  }
});
```

---

## 🔧 **Key Improvements**

1. **✅ Console Spam Fixed**: `conversation-history` sent only once per client
2. **✅ User-on-behalf Messaging**: Perfect for frontend user input
3. **✅ Enhanced AI**: Context-aware responses with metadata
4. **✅ Streaming Support**: Load messages progressively
5. **✅ Auto-trigger AI**: Seamless conversation flow
6. **✅ Error Handling**: Comprehensive error codes
7. **✅ Production Ready**: Robust state management and cleanup

The WebSocket API now provides a complete, spam-free, intelligent chat system ready for production use! 🚀