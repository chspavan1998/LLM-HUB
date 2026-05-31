import * as vscode from "vscode";
import { extensionIds, getExtensionSettings, updateOllamaBaseUrl } from "./config";
import { SidebarViewProvider } from "./chat/SidebarViewProvider";
import { TaskManager } from "./chat/TaskManager";

export function activate(context: vscode.ExtensionContext): void {
  const taskManager = new TaskManager(context.extensionUri);
  const sidebarViewProvider = new SidebarViewProvider(context.extensionUri, taskManager);
  taskManager.attachSidebarProvider(sidebarViewProvider);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      extensionIds.chatView,
      sidebarViewProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devflowAI.openChat", async () => {
      taskManager.createTask();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devflowAI.newTask", async () => {
      taskManager.createTask();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devflowAI.setOllamaUrl", async () => {
      const settings = getExtensionSettings();
      const baseUrl = await vscode.window.showInputBox({
        title: "DevFlow AI: Set Ollama URL",
        prompt: "Enter the base URL for your local Ollama server.",
        value: settings.ollamaBaseUrl,
        placeHolder: "http://localhost:11434",
        ignoreFocusOut: true
      });

      if (!baseUrl) {
        return;
      }

      await updateOllamaBaseUrl(baseUrl.trim());
      taskManager.refreshAll();
      void vscode.window.showInformationMessage(`DevFlow AI Ollama URL set to ${baseUrl.trim()}`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devflowAI.setApiKeyPlaceholder", async () => {
      const value = await vscode.window.showInputBox({
        title: "DevFlow AI: Set API Key Placeholder",
        prompt: "Stored in VS Code SecretStorage for future cloud provider support.",
        password: true,
        ignoreFocusOut: true
      });

      if (value === undefined) {
        return;
      }

      if (value.trim().length === 0) {
        await context.secrets.delete(extensionIds.apiKeyPlaceholderSecret);
        void vscode.window.showInformationMessage("DevFlow AI API key placeholder cleared.");
        return;
      }

      await context.secrets.store(extensionIds.apiKeyPlaceholderSecret, value);
      void vscode.window.showInformationMessage("DevFlow AI API key placeholder saved.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devflowAI.clearChat", async () => {
      const cleared = await taskManager.clearActiveTask();

      if (cleared) {
        void vscode.window.showInformationMessage("DevFlow AI chat cleared.");
        return;
      }

      void vscode.window.showInformationMessage("Open a DevFlow AI task tab to clear its chat.");
    })
  );
}

export function deactivate(): void {}
