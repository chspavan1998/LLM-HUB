export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  providerId?: string;
  modelId?: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  title: string;
  providerId?: string;
  modelId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChatThread = Conversation;
