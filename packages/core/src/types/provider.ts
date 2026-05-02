import type { ModelProviderType } from "./model.js";

export interface ProviderMetadata {
  id: string;
  name: string;
  type: ModelProviderType;
  baseUrl?: string;
  enabled: boolean;
}

