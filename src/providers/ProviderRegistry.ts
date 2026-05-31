import type { ExtensionSettings } from "../config";
import type { LLMProvider } from "./LLMProvider";
import { CloudProvider } from "./CloudProvider";
import { OllamaProvider } from "./OllamaProvider";

export function createProvider(
  providerId: string,
  settings: ExtensionSettings
): LLMProvider {
  if (providerId === "cloud-placeholder") {
    return new CloudProvider();
  }

  return new OllamaProvider(settings.ollamaBaseUrl);
}

