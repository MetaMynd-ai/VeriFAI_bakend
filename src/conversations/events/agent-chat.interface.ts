export interface AgentChatPayloads {
  AgentJoinSession: {
    sessionId: string;
    agentAccountId: string;
  };

  AgentSendMessage: {
    sessionId: string;
    fromAgentId: string;
    message: string;
  };

  EndSession: {
    sessionId: string;
  };
}