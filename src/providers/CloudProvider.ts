import type {
  LLMChatRequest,
  LLMChatResponse,
  LLMProvider,
  LLMStreamHandlers
} from "./LLMProvider";
import { LLMProviderError } from "./LLMProvider";

export class CloudProvider implements LLMProvider {
  readonly id = "cloud-placeholder";
  readonly name = "Cloud Placeholder";

  async streamChat(
    _request: LLMChatRequest,
    _handlers: LLMStreamHandlers
  ): Promise<LLMChatResponse> {
    throw new LLMProviderError(
      "Cloud providers are placeholders in this MVP. OpenAI, Claude, and Gemini are intentionally not implemented yet.",
      this.id
    );
  }
}
