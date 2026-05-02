export interface LlmModel {
  id: string;
  name: string;
  providerId: string;
  contextWindow?: number;
  isLocal: boolean;
}

