import type { LlmModel } from "../types/model.js";
import type {
  ChatCompletionChunk,
  ChatCompletionRequest,
  LlmProvider
} from "./types.js";
import { ProviderError } from "./types.js";

interface OllamaTagsResponse {
  models?: Array<{
    name?: string;
    modified_at?: string;
    size?: number;
  }>;
}

export interface OllamaProviderOptions {
  baseUrl?: string;
}

export class OllamaProvider implements LlmProvider {
  readonly id = "ollama";
  readonly name = "Ollama";
  private readonly baseUrl: URL;

  constructor(options: OllamaProviderOptions = {}) {
    this.baseUrl = new URL(options.baseUrl ?? "http://127.0.0.1:11434");
  }

  async listModels(): Promise<LlmModel[]> {
    try {
      const response = await fetch(new URL("/api/tags", this.baseUrl));

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}`);
      }

      const data = (await response.json()) as OllamaTagsResponse;

      return (data.models ?? [])
        .filter((model) => Boolean(model.name))
        .map((model) => ({
          id: model.name as string,
          name: model.name as string,
          providerId: this.id,
          isLocal: true
        }));
    } catch (error) {
      throw new ProviderError("Unable to read Ollama models.", this.id, error);
    }
  }

  async *streamChat(
    _request: ChatCompletionRequest
  ): AsyncIterable<ChatCompletionChunk> {
    throw new ProviderError(
      "Ollama chat streaming is not wired into the MVP shell yet.",
      this.id
    );
  }
}

