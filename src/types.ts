export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: Exclude<ChatRole, "system">;
  content: string;
  createdAt: string;
  model?: string;
  provider?: string;
}

export interface ChatContextAttachment {
  id: string;
  kind: "selection" | "active-file";
  label: string;
  fileName: string;
  filePath: string;
  languageId: string;
  content: string;
  startLine?: number;
  endLine?: number;
}

export interface EditorContext {
  activeFile?: {
    fileName: string;
    filePath: string;
    languageId: string;
    content: string;
  };
  selection?: {
    fileName: string;
    filePath: string;
    languageId: string;
    startLine: number;
    endLine: number;
    content: string;
  };
}

export interface ChatRequest {
  prompt: string;
  providerId: string;
  model: string;
  includeActiveFile: boolean;
  includeSelection: boolean;
  requestId: string;
  userMessageId?: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  isActive: boolean;
}

export type RequestState =
  | "idle"
  | "connecting"
  | "generating"
  | "cancelling"
  | "done"
  | "error";

export interface WebviewState {
  taskId: string;
  title: string;
  messages: ChatMessage[];
  providerId: string;
  model: string;
  ollamaBaseUrl: string;
  isRequestInFlight: boolean;
  isModelListLoading: boolean;
  requestState: RequestState;
  status: string;
  availableModels: string[];
  modelHint: string;
  attachments: ChatContextAttachment[];
}

export interface SidebarState {
  tasks: TaskSummary[];
}
