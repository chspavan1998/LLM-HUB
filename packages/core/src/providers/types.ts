import type { ChatMessage } from "../types/chat.js";
import type { LlmModel } from "../types/model.js";
import type { ProviderMetadata } from "../types/provider.js";

export interface ChatCompletionRequest {
  modelId: string;
  messages: Pick<ChatMessage, "role" | "content">[];
  temperature?: number;
}

export interface ChatCompletionChunk {
  content: string;
  done: boolean;
}

export interface LlmProvider {
  readonly id: string;
  readonly name: string;
  getMetadata(): ProviderMetadata;
  listModels(): Promise<LlmModel[]>;
  streamChat(request: ChatCompletionRequest): AsyncIterable<ChatCompletionChunk>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly providerId: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
