export type ModelProviderType = "local" | "cloud";

export interface LlmModel {
  id: string;
  name: string;
  providerId: string;
  metadata?: ModelMetadata;
  contextWindow?: number;
  isLocal: boolean;
}

export interface ModelMetadata {
  providerType: ModelProviderType;
  family?: string;
  parameterSize?: string;
  quantization?: string;
}

