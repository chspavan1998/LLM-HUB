import * as vscode from "vscode";

export const extensionIds = {
  chatView: "devflowAI.chatView",
  provider: "devflowAI.provider",
  ollamaBaseUrl: "devflowAI.ollama.baseUrl",
  ollamaModel: "devflowAI.ollama.model",
  apiKeyPlaceholderSecret: "devflowAI.apiKeyPlaceholder"
} as const;

export interface ExtensionSettings {
  providerId: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

export function getExtensionSettings(): ExtensionSettings {
  const config = vscode.workspace.getConfiguration();

  return {
    providerId: config.get<string>(extensionIds.provider, "ollama"),
    ollamaBaseUrl: config.get<string>(
      extensionIds.ollamaBaseUrl,
      "http://localhost:11434"
    ),
    ollamaModel: config.get<string>(extensionIds.ollamaModel, "llama3.2")
  };
}

export async function updateOllamaBaseUrl(baseUrl: string): Promise<void> {
  await vscode.workspace
    .getConfiguration()
    .update(extensionIds.ollamaBaseUrl, baseUrl, vscode.ConfigurationTarget.Global);
}

