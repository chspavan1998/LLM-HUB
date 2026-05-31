import * as vscode from "vscode";
import type { SidebarState } from "../types";
import { TaskPanel } from "./TaskPanel";
import type { SidebarViewProvider } from "./SidebarViewProvider";

export class TaskManager {
  private readonly tasks = new Map<string, TaskPanel>();
  private readonly iconUri: vscode.Uri;
  private sidebarProvider?: SidebarViewProvider;
  private activeTaskId?: string;

  constructor(private readonly extensionUri: vscode.Uri) {
    this.iconUri = vscode.Uri.joinPath(extensionUri, "media", "devflow.svg");
  }

  attachSidebarProvider(provider: SidebarViewProvider): void {
    this.sidebarProvider = provider;
    this.refreshSidebar();
  }

  createTask(): void {
    const task = new TaskPanel(this.extensionUri, this.iconUri, {
      onTaskUpdated: () => {
        this.refreshSidebar();
      },
      onTaskDisposed: (taskId) => {
        this.tasks.delete(taskId);

        if (this.activeTaskId === taskId) {
          const nextTask = [...this.tasks.values()].sort((left, right) =>
            right.getSummary(false).updatedAt.localeCompare(left.getSummary(false).updatedAt)
          )[0];
          this.activeTaskId = nextTask?.id;
        }

        this.refreshSidebar();
      },
      onTaskActivated: (taskId) => {
        this.activeTaskId = taskId;
        this.refreshSidebar();
      },
      onNewTaskRequested: () => {
        this.createTask();
      },
      onSettingsRequested: () => {
        void vscode.commands.executeCommand("workbench.action.openSettings", "devflowAI");
      }
    });

    this.tasks.set(task.id, task);
    this.activeTaskId = task.id;
    this.refreshSidebar();
  }

  revealTask(taskId: string): void {
    const task = this.tasks.get(taskId);

    if (!task) {
      return;
    }

    this.activeTaskId = taskId;
    task.reveal();
    this.refreshSidebar();
  }

  closeTask(taskId: string): void {
    this.tasks.get(taskId)?.dispose();
  }

  async clearActiveTask(): Promise<boolean> {
    if (!this.activeTaskId) {
      return false;
    }

    const task = this.tasks.get(this.activeTaskId);

    if (!task) {
      return false;
    }

    await task.clearChat();
    this.refreshSidebar();
    return true;
  }

  refreshAll(): void {
    for (const task of this.tasks.values()) {
      task.refresh();
    }

    this.refreshSidebar();
  }

  getSidebarState(): SidebarState {
    const tasks = [...this.tasks.values()]
      .map((task) => task.getSummary(task.id === this.activeTaskId))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    return { tasks };
  }

  private refreshSidebar(): void {
    this.sidebarProvider?.refresh();
  }
}
