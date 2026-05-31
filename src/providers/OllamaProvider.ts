import type { EditorContext } from "../types";
import type {
  LLMChatMessage,
  LLMChatRequest,
  LLMChatResponse,
  LLMProvider,
  LLMStreamHandlers
} from "./LLMProvider";
import { LLMProviderError } from "./LLMProvider";

interface OllamaStreamResponse {
  done?: boolean;
  error?: string;
  message?: {
    content?: string;
  };
}

interface OllamaTagsResponse {
  models?: Array<{
    name?: string;
  }>;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function buildContextMessage(context: EditorContext): LLMChatMessage | undefined {
  const sections: string[] = [];

  if (context.activeFile) {
    sections.push(
      [
        `Active file: ${context.activeFile.fileName}`,
        `Path: ${context.activeFile.filePath}`,
        `Language: ${context.activeFile.languageId}`,
        "```",
        context.activeFile.content,
        "```"
      ].join("\n")
    );
  }

  if (context.selection) {
    sections.push(
      [
        `File: ${context.selection.fileName}`,
        `Path: ${context.selection.filePath}`,
        `Lines: ${context.selection.startLine}-${context.selection.endLine}`,
        "Code:",
        `\`\`\`${context.selection.languageId}`,
        context.selection.content,
        "```"
      ].join("\n")
    );
  }

  if (sections.length === 0) {
    return undefined;
  }

  return {
    role: "system",
    content: [
      "Use this VS Code editor context when it is relevant to the user's request.",
      ...sections
    ].join("\n\n")
  };
}

function parseOllamaError(detail: string, model: string): string {
  const normalized = detail.toLowerCase();

  if (
    normalized.includes("model") &&
    (normalized.includes("not found") || normalized.includes("pull"))
  ) {
    return `Model not found. Pull it using: ollama pull ${model}`;
  }

  if (
    normalized.includes("connection refused") ||
    normalized.includes("connect") ||
    normalized.includes("failed to fetch")
  ) {
    return "Could not connect to Ollama. Please start Ollama and try again.";
  }

  if (detail.trim().length > 0) {
    return detail.trim();
  }

  return "Could not connect to Ollama. Please start Ollama and try again.";
}

function extractLines(buffer: string): { lines: string[]; remainder: string } {
  const lines = buffer.split("\n");

  return {
    lines: lines.slice(0, -1).map((line) => line.trim()).filter(Boolean),
    remainder: lines.at(-1) ?? ""
  };
}

export async function fetchOllamaModels(baseUrl: string): Promise<string[]> {
  let response: Response;

  try {
    response = await fetch(`${trimTrailingSlash(baseUrl)}/api/tags`);
  } catch (error) {
    throw new LLMProviderError(
      "Ollama is not running. Start Ollama and click Refresh Models.",
      "ollama",
      error
    );
  }

  if (!response.ok) {
    throw new LLMProviderError(
      "Ollama is not running. Start Ollama and click Refresh Models.",
      "ollama"
    );
  }

  const data = (await response.json()) as OllamaTagsResponse;
  const names = Array.from(
    new Set(
      (data.models ?? [])
        .map((entry) => entry.name?.trim() ?? "")
        .filter((name) => name.length > 0)
    )
  );

  console.log("[DevFlow AI] Ollama models:", names);

  return names;
}

export class OllamaProvider implements LLMProvider {
  readonly id = "ollama";
  readonly name = "Ollama";

  constructor(private readonly baseUrl: string) {}

  async streamChat(
    request: LLMChatRequest,
    handlers: LLMStreamHandlers
  ): Promise<LLMChatResponse> {
    const contextMessage = buildContextMessage(request.context);
    const messages: LLMChatMessage[] = [
      ...(contextMessage ? [contextMessage] : []),
      ...request.history,
      {
        role: "user",
        content: request.prompt
      }
    ];

    handlers.onStatus("Connecting to Ollama...");

    let response: Response;

    try {
      response = await fetch(`${trimTrailingSlash(this.baseUrl)}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: request.model,
          messages,
          stream: true
        }),
        signal: request.signal
      });
    } catch (error) {
      if (request.signal?.aborted) {
        throw error;
      }

      throw new LLMProviderError(
        "Could not connect to Ollama. Please start Ollama and try again.",
        this.id,
        error
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");

      throw new LLMProviderError(parseOllamaError(detail, request.model), this.id);
    }

    if (!response.body) {
      throw new LLMProviderError("Ollama did not return a readable response stream.", this.id);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const extracted = extractLines(buffer);
      buffer = extracted.remainder;

      for (const line of extracted.lines) {
        const payload = JSON.parse(line) as OllamaStreamResponse;

        if (payload.error) {
          throw new LLMProviderError(parseOllamaError(payload.error, request.model), this.id);
        }

        const chunk = payload.message?.content ?? "";

        if (chunk.length > 0) {
          handlers.onStatus("Generating response...");
          handlers.onChunk(chunk);
          content += chunk;
        }
      }
    }

    const trailing = buffer.trim();

    if (trailing.length > 0) {
      const payload = JSON.parse(trailing) as OllamaStreamResponse;

      if (payload.error) {
        throw new LLMProviderError(parseOllamaError(payload.error, request.model), this.id);
      }

      const chunk = payload.message?.content ?? "";

      if (chunk.length > 0) {
        handlers.onStatus("Generating response...");
        handlers.onChunk(chunk);
        content += chunk;
      }
    }

    if (!content.trim()) {
      throw new LLMProviderError(
        "Ollama returned an empty response. Make sure the selected model is available and responding.",
        this.id
      );
    }

    return {
      content,
      model: request.model
    };
  }
}
