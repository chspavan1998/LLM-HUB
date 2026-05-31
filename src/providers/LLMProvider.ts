import type { EditorContext } from "../types";

export interface LLMChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMChatRequest {
  model: string;
  prompt: string;
  history: LLMChatMessage[];
  context: EditorContext;
  signal?: AbortSignal;
}

export interface LLMChatResponse {
  content: string;
  model: string;
}

export interface LLMStreamHandlers {
  onChunk(chunk: string): void;
  onStatus(status: string): void;
}

export interface LLMProvider {
  readonly id: string;
  readonly name: string;
  streamChat(
    request: LLMChatRequest,
    handlers: LLMStreamHandlers
  ): Promise<LLMChatResponse>;
}

export class LLMProviderError extends Error {
  constructor(
    message: string,
    public readonly providerId: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "LLMProviderError";
  }
}
