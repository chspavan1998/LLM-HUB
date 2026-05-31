import * as vscode from "vscode";
import { getSidebarHtml } from "../webview/sidebarHtml";
import { TaskManager } from "./TaskManager";

interface NewTaskMessage {
  type: "newTask";
}

interface OpenTaskMessage {
  type: "openTask";
  taskId?: string;
}

interface CloseTaskMessage {
  type: "closeTask";
  taskId?: string;
}

interface OpenSettingsMessage {
  type: "openSettings";
}

type SidebarMessage =
  | NewTaskMessage
  | OpenTaskMessage
  | CloseTaskMessage
  | OpenSettingsMessage;

export class SidebarViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly taskManager: TaskManager
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")]
    };

    webviewView.webview.html = getSidebarHtml(
      webviewView.webview.cspSource,
      this.taskManager.getSidebarState()
    );

    webviewView.webview.onDidReceiveMessage((message: SidebarMessage) => {
      if (message.type === "newTask") {
        this.taskManager.createTask();
        return;
      }

      if (message.type === "openTask" && message.taskId) {
        this.taskManager.revealTask(message.taskId);
        return;
      }

      if (message.type === "closeTask" && message.taskId) {
        this.taskManager.closeTask(message.taskId);
        return;
      }

      if (message.type === "openSettings") {
        void vscode.commands.executeCommand("workbench.action.openSettings", "devflowAI");
      }
    });

    this.refresh();
  }

  refresh(): void {
    void this.view?.webview.postMessage({
      type: "tasksUpdated",
      ...this.taskManager.getSidebarState()
    });
  }
}
