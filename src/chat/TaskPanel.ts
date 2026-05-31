import * as vscode from "vscode";
import { getExtensionSettings } from "../config";
import {
  buildEditorContextFromAttachments,
  captureActiveFileAttachment,
  captureSelectionAttachmentFromEditor
} from "../context/editorContext";
import { createProvider } from "../providers/ProviderRegistry";
import type { LLMChatMessage } from "../providers/LLMProvider";
import { fetchOllamaModels } from "../providers/OllamaProvider";
import type {
  ChatContextAttachment,
  ChatMessage,
  ChatRequest,
  RequestState,
  TaskSummary,
  WebviewState
} from "../types";
import { getChatHtml } from "../webview/chatHtml";

interface LoadModelsMessage {
  type: "loadModels";
  providerId?: string;
  model?: string;
}

interface SendPromptMessage extends Partial<ChatRequest> {
  type: "sendPrompt";
}

interface StopGenerationMessage {
  type: "stopGeneration";
  requestId?: string;
}

interface ClearChatMessage {
  type: "clearChat";
}

interface NewTaskMessage {
  type: "newTask";
}

interface CloseTaskMessage {
  type: "closeTask";
}

interface AttachActiveFileMessage {
  type: "attachActiveFile";
}

interface RemoveAttachmentMessage {
  type: "removeAttachment";
  attachmentId?: string;
}

interface ResolvePasteSelectionMessage {
  type: "resolvePasteSelection";
  pasteId?: string;
  pastedText?: string;
}

interface OpenSettingsMessage {
  type: "openSettings";
}

type WebviewMessage =
  | LoadModelsMessage
  | SendPromptMessage
  | StopGenerationMessage
  | ClearChatMessage
  | NewTaskMessage
  | CloseTaskMessage
  | AttachActiveFileMessage
  | RemoveAttachmentMessage
  | ResolvePasteSelectionMessage
  | OpenSettingsMessage;

interface ActiveRequest {
  requestId: string;
  assistantMessageId: string;
  controller: AbortController;
  hasReceivedChunk: boolean;
  slowStartTimer?: ReturnType<typeof setTimeout>;
}

interface TaskPanelDelegates {
  onTaskUpdated(): void;
  onTaskDisposed(taskId: string): void;
  onTaskActivated(taskId: string): void;
  onNewTaskRequested(): void;
  onSettingsRequested(): void;
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toProviderHistory(messages: ChatMessage[]): LLMChatMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content
  }));
}

function getTaskTitle(currentTitle: string, prompt: string): string {
  if (currentTitle !== "New Task") {
    return currentTitle;
  }

  const trimmed = prompt.trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 39)}...` : trimmed;
}

export class TaskPanel {
  readonly id: string;
  private readonly panel: vscode.WebviewPanel;
  private messages: ChatMessage[] = [];
  private attachments: ChatContextAttachment[] = [];
  private availableModels: string[] = [];
  private currentModel?: string;
  private currentProviderId?: string;
  private isModelListLoading = false;
  private requestState: RequestState = "idle";
  private status = "Ready";
  private modelHint = "";
  private activeRequest?: ActiveRequest;
  private readyResetTimer?: ReturnType<typeof setTimeout>;
  private disposed = false;
  private title = "New Task";
  private updatedAt = new Date().toISOString();

  constructor(
    extensionUri: vscode.Uri,
    iconUri: vscode.Uri,
    delegates: TaskPanelDelegates
  ) {
    this.id = createId();
    this.delegates = delegates;
    this.panel = vscode.window.createWebviewPanel(
      "devflowAI.task",
      this.title,
      {
        viewColumn: vscode.ViewColumn.Active,
        preserveFocus: false
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")]
      }
    );

    this.panel.iconPath = iconUri;
    this.panel.webview.html = getChatHtml(this.panel.webview.cspSource, this.getState());
    this.panel.webview.onDidReceiveMessage((message: WebviewMessage) => {
      this.handleMessage(message);
    });
    this.panel.onDidDispose(() => {
      this.handleDispose();
    });
    this.panel.onDidChangeViewState(() => {
      if (this.panel.active) {
        this.delegates.onTaskActivated(this.id);
      }
    });

    void this.loadModels();
    this.postStateUpdated();
  }

  private readonly delegates: TaskPanelDelegates;

  getSummary(isActive: boolean): TaskSummary {
    return {
      id: this.id,
      title: this.title,
      status: this.status,
      updatedAt: this.updatedAt,
      isActive
    };
  }

  reveal(): void {
    this.panel.reveal(undefined, false);
  }

  refresh(): void {
    void this.loadModels();
    this.postStateUpdated();
  }

  async clearChat(): Promise<void> {
    if (this.activeRequest) {
      return;
    }

    this.clearReadyResetTimer();
    this.messages = [];
    this.attachments = [];
    this.title = "New Task";
    this.panel.title = this.title;
    this.requestState = "idle";
    this.status = "Ready";
    this.touch();
    this.postStateUpdated();
  }

  dispose(): void {
    if (!this.disposed) {
      this.panel.dispose();
    }
  }

  private handleDispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.clearReadyResetTimer();

    if (this.activeRequest?.slowStartTimer) {
      clearTimeout(this.activeRequest.slowStartTimer);
    }

    if (this.activeRequest) {
      this.activeRequest.controller.abort();
      this.activeRequest = undefined;
    }

    this.delegates.onTaskDisposed(this.id);
  }

  private async handleMessage(message: WebviewMessage): Promise<void> {
    if (message.type === "loadModels") {
      this.currentProviderId = message.providerId ?? this.currentProviderId;
      this.currentModel = message.model?.trim() || this.currentModel;
      await this.loadModels();
      return;
    }

    if (message.type === "sendPrompt") {
      await this.handleSendPrompt(message);
      return;
    }

    if (message.type === "stopGeneration") {
      this.stopGeneration(message.requestId);
      return;
    }

    if (message.type === "clearChat") {
      await this.clearChat();
      return;
    }

    if (message.type === "newTask") {
      this.delegates.onNewTaskRequested();
      return;
    }

    if (message.type === "closeTask") {
      this.dispose();
      return;
    }

    if (message.type === "attachActiveFile") {
      this.attachActiveFile();
      return;
    }

    if (message.type === "removeAttachment") {
      this.removeAttachment(message.attachmentId);
      return;
    }

    if (message.type === "resolvePasteSelection") {
      this.resolvePasteSelection(message.pasteId, message.pastedText);
      return;
    }

    if (message.type === "openSettings") {
      this.delegates.onSettingsRequested();
    }
  }

  private touch(): void {
    this.updatedAt = new Date().toISOString();
    this.delegates.onTaskUpdated();
  }

  private clearReadyResetTimer(): void {
    if (this.readyResetTimer) {
      clearTimeout(this.readyResetTimer);
      this.readyResetTimer = undefined;
    }
  }

  private scheduleReadyReset(): void {
    this.clearReadyResetTimer();
    this.readyResetTimer = setTimeout(() => {
      if (this.activeRequest) {
        return;
      }

      this.requestState = "idle";
      this.status = "Ready";
      this.touch();
      this.postStateUpdated();
      this.readyResetTimer = undefined;
    }, 1200);
  }

  private getState(): WebviewState {
    const settings = getExtensionSettings();

    return {
      taskId: this.id,
      title: this.title,
      messages: this.messages,
      providerId: this.currentProviderId ?? settings.providerId,
      model: this.currentModel ?? settings.ollamaModel,
      ollamaBaseUrl: settings.ollamaBaseUrl,
      isRequestInFlight: Boolean(this.activeRequest),
      isModelListLoading: this.isModelListLoading,
      requestState: this.requestState,
      status: this.status,
      availableModels: this.availableModels,
      modelHint: this.modelHint,
      attachments: this.attachments
    };
  }

  private postMessage(message: Record<string, unknown>): void {
    void this.panel.webview.postMessage(message);
  }

  private postStateUpdated(): void {
    this.postMessage({
      type: "stateUpdated",
      ...this.getState()
    });
  }

  private postModelsLoaded(): void {
    this.postMessage({
      type: "modelsLoaded",
      ...this.getState()
    });
  }

  private async loadModels(): Promise<void> {
    const settings = getExtensionSettings();
    const providerId = this.currentProviderId ?? settings.providerId;
    const model = this.currentModel ?? settings.ollamaModel;

    this.currentProviderId = providerId;
    this.currentModel = model;

    if (providerId !== "ollama") {
      this.availableModels = [];
      this.modelHint = "Manual model entry is available for placeholder providers.";
      this.isModelListLoading = false;
      this.touch();
      this.postModelsLoaded();
      return;
    }

    this.isModelListLoading = true;
    this.postModelsLoaded();

    try {
      const models = await fetchOllamaModels(settings.ollamaBaseUrl);

      this.availableModels = models;
      this.modelHint =
        models.length === 0
          ? "No Ollama models found. Run: ollama pull llama3.2"
          : "";
    } catch (error) {
      this.availableModels = [];
      this.modelHint =
        error instanceof Error
          ? error.message
          : "Ollama is not running. Start Ollama and click Refresh Models.";
    }

    this.isModelListLoading = false;
    this.touch();
    this.postModelsLoaded();
  }

  private stopGeneration(requestId?: string): void {
    if (!this.activeRequest) {
      return;
    }

    if (requestId && requestId !== this.activeRequest.requestId) {
      return;
    }

    this.requestState = "cancelling";
    this.status = "Cancelling...";
    this.touch();
    this.postMessage({
      type: "generationCancelled",
      requestId: this.activeRequest.requestId,
      requestState: this.requestState,
      status: this.status,
      finished: false
    });
    this.activeRequest.controller.abort();
    this.postStateUpdated();
  }

  private upsertAttachment(attachment: ChatContextAttachment): void {
    this.attachments = [
      ...this.attachments.filter((entry) => entry.kind !== attachment.kind),
      attachment
    ];
    this.touch();
    this.postStateUpdated();
  }

  private removeAttachment(attachmentId?: string): void {
    if (!attachmentId) {
      return;
    }

    this.attachments = this.attachments.filter((attachment) => attachment.id !== attachmentId);
    this.touch();
    this.postStateUpdated();
  }

  private attachActiveFile(): void {
    const attachment = captureActiveFileAttachment();

    if (!attachment) {
      this.status = "Error";
      this.touch();
      this.postMessage({
        type: "streamError",
        requestState: "error",
        status: this.status,
        errorMessage: "Open a file to attach it as context."
      });
      this.scheduleReadyReset();
      return;
    }

    this.upsertAttachment(attachment);
  }

  private resolvePasteSelection(pasteId?: string, pastedText?: string): void {
    const resolved = captureSelectionAttachmentFromEditor(pastedText ?? "");

    if (resolved) {
      this.attachments = [
        ...this.attachments.filter((attachment) => attachment.kind !== "selection"),
        resolved
      ];
      this.touch();
      this.postStateUpdated();
    }

    this.postMessage({
      type: "pasteSelectionResolved",
      pasteId,
      attachment: resolved ?? null,
      pastedText: pastedText ?? ""
    });
  }

  private async handleSendPrompt(message: SendPromptMessage): Promise<void> {
    const prompt = message.prompt?.trim();

    if (!prompt || this.activeRequest) {
      return;
    }

    this.clearReadyResetTimer();

    const settings = getExtensionSettings();
    const providerId = message.providerId ?? this.currentProviderId ?? settings.providerId;
    const model = message.model?.trim() || this.currentModel || settings.ollamaModel;
    const requestId = message.requestId ?? createId();
    const userMessageId = message.userMessageId ?? createId();

    this.currentProviderId = providerId;
    this.currentModel = model;

    const provider = createProvider(providerId, settings);
    const priorMessages = [...this.messages];
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString(),
      model,
      provider: provider.id
    };
    const assistantMessage: ChatMessage = {
      id: requestId,
      role: "assistant",
      content: "Thinking...",
      createdAt: new Date().toISOString(),
      model,
      provider: provider.id
    };

    this.title = getTaskTitle(this.title, prompt);
    this.panel.title = this.title;
    this.messages = [...this.messages, userMessage, assistantMessage];
    this.requestState = "connecting";
    this.status = provider.id === "ollama" ? "Connecting to Ollama..." : "Connecting...";

    const controller = new AbortController();
    const activeRequest: ActiveRequest = {
      requestId,
      assistantMessageId: requestId,
      controller,
      hasReceivedChunk: false
    };

    activeRequest.slowStartTimer = setTimeout(() => {
      if (this.activeRequest?.requestId === requestId && !activeRequest.hasReceivedChunk) {
        this.status = "Still waiting. The model may be loading for the first time.";
        this.touch();
        this.postMessage({
          type: "streamStart",
          requestId,
          requestState: this.requestState,
          status: this.status
        });
      }
    }, 30000);

    this.activeRequest = activeRequest;
    this.touch();
    this.postStateUpdated();
    this.postMessage({
      type: "streamStart",
      requestId,
      requestState: this.requestState,
      status: this.status
    });

    try {
      const context = buildEditorContextFromAttachments(this.attachments);

      await provider.streamChat(
        {
          model,
          prompt,
          history: toProviderHistory(priorMessages),
          context,
          signal: controller.signal
        },
        {
          onStatus: (status) => {
            if (status === "Generating response...") {
              activeRequest.hasReceivedChunk = true;
              this.requestState = "generating";
            }

            this.status = status;
          },
          onChunk: (chunk) => {
            activeRequest.hasReceivedChunk = true;

            if (activeRequest.slowStartTimer) {
              clearTimeout(activeRequest.slowStartTimer);
              activeRequest.slowStartTimer = undefined;
            }

            this.messages = this.messages.map((entry) =>
              entry.id === activeRequest.assistantMessageId
                ? {
                    ...entry,
                    content:
                      entry.content === "Thinking..."
                        ? chunk
                        : `${entry.content}${chunk}`
                  }
                : entry
            );
            this.touch();
            this.postMessage({
              type: "streamChunk",
              requestId,
              requestState: "generating",
              status: "Generating response...",
              chunk
            });
          }
        }
      );

      if (activeRequest.slowStartTimer) {
        clearTimeout(activeRequest.slowStartTimer);
      }

      this.requestState = "done";
      this.status = "Done";
      this.activeRequest = undefined;
      this.touch();
      this.postMessage({
        type: "streamEnd",
        requestId,
        requestState: this.requestState,
        status: this.status
      });
      this.postStateUpdated();
      this.scheduleReadyReset();
    } catch (error) {
      if (activeRequest.slowStartTimer) {
        clearTimeout(activeRequest.slowStartTimer);
      }

      const wasCancelled = controller.signal.aborted;

      if (wasCancelled) {
        const replacementText = activeRequest.hasReceivedChunk ? undefined : "Generation stopped.";

        if (replacementText) {
          this.messages = this.messages.map((entry) =>
            entry.id === activeRequest.assistantMessageId
              ? {
                  ...entry,
                  content: replacementText
                }
              : entry
          );
        }

        this.requestState = "idle";
        this.status = "Cancelled";
        this.activeRequest = undefined;
        this.touch();
        this.postMessage({
          type: "generationCancelled",
          requestId,
          requestState: this.requestState,
          status: this.status,
          finished: true,
          replacementText
        });
        this.postStateUpdated();
        this.scheduleReadyReset();
        return;
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "DevFlow AI could not complete the chat request.";

      this.messages = this.messages.map((entry) =>
        entry.id === activeRequest.assistantMessageId
          ? {
              ...entry,
              content: errorMessage
            }
          : entry
      );
      this.requestState = "error";
      this.status = "Error";
      this.activeRequest = undefined;
      this.touch();
      this.postMessage({
        type: "streamError",
        requestId,
        requestState: this.requestState,
        status: this.status,
        errorMessage
      });
      this.postStateUpdated();
      this.scheduleReadyReset();
    }
  }
}
