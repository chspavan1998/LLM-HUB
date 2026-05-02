export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  chatId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  modelId?: string;
}

export interface ChatThread {
  id: string;
  workspaceId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

