import type { SidebarState } from "../types";
import { renderIcon } from "./icons";

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let value = "";

  for (let index = 0; index < 32; index += 1) {
    value += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return value;
}

export function getSidebarHtml(cspSource: string, state: SidebarState): string {
  const nonce = getNonce();
  const encodedState = JSON.stringify(state)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src ${cspSource} https:; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DevFlow AI</title>
    <style>
      :root {
        color: var(--vscode-foreground);
        background: var(--vscode-sideBar-background);
        font-family: var(--vscode-font-family);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: var(--vscode-sideBar-background);
      }

      button {
        font: inherit;
      }

      .shell {
        display: grid;
        gap: 12px;
        min-height: 100vh;
        padding: 12px;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .titleBlock {
        display: grid;
        gap: 4px;
      }

      h1 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
      }

      .subtitle {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
      }

      .iconButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        border: 1px solid transparent;
        border-radius: 7px;
        color: var(--vscode-foreground);
        background: var(--vscode-input-background);
      }

      .iconButton:hover {
        border-color: var(--vscode-focusBorder);
      }

      .iconButton svg {
        width: 16px;
        height: 16px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .taskList {
        display: grid;
        gap: 8px;
      }

      .taskCard {
        display: grid;
        gap: 8px;
        padding: 10px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        background: var(--vscode-editor-background);
      }

      .taskCard.active {
        border-color: var(--vscode-focusBorder);
      }

      .taskRow {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 8px;
      }

      .taskOpen {
        display: grid;
        gap: 4px;
        min-width: 0;
        padding: 0;
        border: none;
        text-align: left;
        color: inherit;
        background: transparent;
      }

      .taskTitle {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 600;
      }

      .taskMeta {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
      }

      .emptyState {
        padding: 16px 12px;
        border: 1px dashed var(--vscode-panel-border);
        border-radius: 8px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header class="header">
        <div class="titleBlock">
          <h1>DevFlow AI</h1>
          <span class="subtitle">Launch clean task tabs for each conversation.</span>
        </div>
        <div>
          <button class="iconButton" id="newTaskButton" title="New Task" aria-label="New Task" type="button">${renderIcon("plus")}</button>
          <button class="iconButton" id="settingsButton" title="Settings" aria-label="Settings" type="button">${renderIcon("settings")}</button>
        </div>
      </header>

      <section class="taskList" id="taskList"></section>
    </div>

    <script nonce="${nonce}" id="initialState" type="application/json">${encodedState}</script>
    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      const initialState = JSON.parse(document.getElementById("initialState").textContent);
      const taskList = document.getElementById("taskList");
      const newTaskButton = document.getElementById("newTaskButton");
      const settingsButton = document.getElementById("settingsButton");

      const icons = {
        panel: ${JSON.stringify(renderIcon("panel"))},
        close: ${JSON.stringify(renderIcon("close"))}
      };

      let tasks = initialState.tasks ?? [];

      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      function escapeAttribute(value) {
        return escapeHtml(value).replaceAll("\\n", " ");
      }

      function renderTasks() {
        if (tasks.length === 0) {
          taskList.innerHTML =
            '<div class="emptyState">Start a new task to open an editor-tab chat. Each task stays separate and can be closed when you are done.</div>';
          return;
        }

        taskList.innerHTML = tasks
          .map((task) => {
            const activeClass = task.isActive ? " active" : "";

            return (
              '<article class="taskCard' +
              activeClass +
              '">' +
              '<div class="taskRow">' +
              '<button class="taskOpen" data-open-task="' +
              escapeAttribute(task.id) +
              '" type="button">' +
              '<span class="taskTitle">' +
              escapeHtml(task.title) +
              "</span>" +
              '<span class="taskMeta">' +
              escapeHtml(task.status) +
              "</span>" +
              "</button>" +
              '<button class="iconButton" data-close-task="' +
              escapeAttribute(task.id) +
              '" title="Close Task" aria-label="Close Task" type="button">' +
              icons.close +
              "</button>" +
              "</div>" +
              '<div class="taskMeta">' +
              escapeHtml(new Date(task.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })) +
              "</div>" +
              "</article>"
            );
          })
          .join("");
      }

      newTaskButton.addEventListener("click", () => {
        vscode.postMessage({ type: "newTask" });
      });

      settingsButton.addEventListener("click", () => {
        vscode.postMessage({ type: "openSettings" });
      });

      taskList.addEventListener("click", (event) => {
        const closeButton = event.target.closest("[data-close-task]");

        if (closeButton) {
          vscode.postMessage({
            type: "closeTask",
            taskId: closeButton.getAttribute("data-close-task")
          });
          return;
        }

        const openButton = event.target.closest("[data-open-task]");

        if (openButton) {
          vscode.postMessage({
            type: "openTask",
            taskId: openButton.getAttribute("data-open-task")
          });
        }
      });

      window.addEventListener("message", (event) => {
        if (event.data.type === "tasksUpdated") {
          tasks = event.data.tasks ?? [];
          renderTasks();
        }
      });

      renderTasks();
    </script>
  </body>
</html>`;
}
