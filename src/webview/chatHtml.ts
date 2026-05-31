import type { WebviewState } from "../types";
import { renderIcon } from "./icons";

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let value = "";

  for (let index = 0; index < 32; index += 1) {
    value += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return value;
}

export function getChatHtml(cspSource: string, state: WebviewState): string {
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
        background: var(--vscode-editor-background);
        font-family: var(--vscode-font-family);
        font-size: 13px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
      }

      button,
      input,
      select,
      textarea {
        font: inherit;
      }

      .shell {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        min-height: 100vh;
        background: var(--vscode-editor-background);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border-bottom: 1px solid var(--vscode-panel-border);
        background: var(--vscode-sideBar-background);
      }

      .titleBlock {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      .title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        font-weight: 700;
      }

      .status {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
      }

      .toolbar {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .iconButton,
      .sendButton,
      .stopButton,
      .chipRemove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid transparent;
        border-radius: 8px;
        color: var(--vscode-foreground);
        background: var(--vscode-input-background);
      }

      .iconButton,
      .chipRemove {
        width: 30px;
        height: 30px;
        padding: 0;
      }

      .iconButton:hover:enabled,
      .sendButton:hover:enabled,
      .stopButton:hover:enabled,
      .chipRemove:hover:enabled {
        border-color: var(--vscode-focusBorder);
      }

      .iconButton svg,
      .sendButton svg,
      .stopButton svg,
      .chipRemove svg,
      .messageAction svg {
        width: 16px;
        height: 16px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .messages {
        display: flex;
        min-height: 0;
        flex-direction: column;
        gap: 14px;
        overflow: auto;
        padding: 16px 18px;
      }

      .emptyState {
        display: grid;
        gap: 8px;
        width: min(560px, 100%);
        margin: auto;
        padding: 18px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 12px;
        background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
        color: var(--vscode-descriptionForeground);
        line-height: 1.55;
      }

      .emptyTitle {
        color: var(--vscode-foreground);
        font-weight: 700;
      }

      .message {
        display: grid;
        gap: 8px;
        max-width: min(880px, 100%);
        padding: 12px 14px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 12px;
        background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
      }

      .message.user {
        align-self: end;
        background: color-mix(in srgb, var(--vscode-button-background) 14%, var(--vscode-editor-background));
      }

      .message.assistant {
        align-self: stretch;
      }

      .messageHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .messageLabel {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
      }

      .messageAction {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        border: 1px solid transparent;
        border-radius: 8px;
        color: var(--vscode-descriptionForeground);
        background: transparent;
        opacity: 0;
        transition: opacity 120ms ease;
      }

      .message:hover .messageAction {
        opacity: 1;
      }

      .messageBody {
        display: grid;
        gap: 10px;
        line-height: 1.58;
      }

      .textBlock {
        white-space: normal;
        word-break: break-word;
      }

      .codeBlock {
        margin: 0;
        overflow: auto;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        background: var(--vscode-textCodeBlock-background, var(--vscode-editor-background));
      }

      .codeLabel {
        padding: 7px 10px;
        border-bottom: 1px solid var(--vscode-panel-border);
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
      }

      .codeContent {
        margin: 0;
        padding: 12px;
        white-space: pre;
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        line-height: 1.55;
      }

      .composerShell {
        display: grid;
        gap: 10px;
        padding: 12px 14px 14px;
        border-top: 1px solid var(--vscode-panel-border);
        background: var(--vscode-sideBar-background);
      }

      .attachmentRow {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 30px;
      }

      .attachmentChip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        max-width: min(100%, 420px);
        min-height: 30px;
        padding: 4px 8px;
        border: 1px solid var(--vscode-focusBorder);
        border-radius: 999px;
        background: var(--vscode-editor-background);
      }

      .chipLabel {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .composerFrame {
        display: grid;
        gap: 10px;
        padding: 10px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 14px;
        background: var(--vscode-editor-background);
      }

      .composerTop {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 10px;
        align-items: end;
      }

      .composerHint {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        line-height: 1.4;
      }

      textarea {
        width: 100%;
        min-height: 98px;
        max-height: 240px;
        resize: vertical;
        padding: 0;
        border: none;
        color: var(--vscode-input-foreground);
        background: transparent;
        line-height: 1.55;
        outline: none;
      }

      .sendButton,
      .stopButton {
        width: 36px;
        height: 36px;
        padding: 0;
        color: var(--vscode-button-foreground);
        background: var(--vscode-button-background);
      }

      .stopButton {
        color: var(--vscode-button-secondaryForeground);
        background: var(--vscode-button-secondaryBackground);
      }

      .footerBar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .pillBadge,
      .pillControl,
      .pillInput {
        min-height: 30px;
        padding: 4px 10px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 999px;
        color: var(--vscode-foreground);
        background: var(--vscode-input-background);
      }

      .pillBadge {
        color: var(--vscode-descriptionForeground);
        background: var(--vscode-editor-background);
      }

      .pillControl {
        max-width: 170px;
      }

      .pillInput {
        flex: 1 1 180px;
        min-width: 160px;
      }

      button:disabled,
      input:disabled,
      select:disabled,
      textarea:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      @media (max-width: 680px) {
        .header,
        .messages,
        .composerShell {
          padding-left: 12px;
          padding-right: 12px;
        }

        .composerTop {
          grid-template-columns: auto minmax(0, 1fr);
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header class="header">
        <div class="titleBlock">
          <div class="title" id="taskTitle">New Task</div>
          <div class="status" id="statusText">Ready</div>
        </div>
        <div class="toolbar">
          <button class="iconButton" id="newTaskButton" title="New Task" aria-label="New Task" type="button">${renderIcon("plus")}</button>
          <button class="iconButton" id="refreshButton" title="Refresh Models" aria-label="Refresh Models" type="button">${renderIcon("refresh")}</button>
          <button class="iconButton" id="clearButton" title="Clear Chat" aria-label="Clear Chat" type="button">${renderIcon("trash")}</button>
          <button class="iconButton" id="settingsButton" title="Settings" aria-label="Settings" type="button">${renderIcon("settings")}</button>
          <button class="iconButton" id="closeTaskButton" title="Close Task" aria-label="Close Task" type="button">${renderIcon("close")}</button>
        </div>
      </header>

      <main class="messages" id="messages"></main>

      <section class="composerShell">
        <div class="attachmentRow" id="attachmentRow"></div>
        <div class="composerFrame">
          <div class="composerTop">
            <button class="iconButton" id="attachFileButton" title="Attach Active File" aria-label="Attach Active File" type="button">${renderIcon("file")}</button>
            <div>
              <textarea
                id="promptInput"
                placeholder="Ask DevFlow to explain, debug, refactor, or review..."
              ></textarea>
              <div class="composerHint">Paste selected code from the editor to attach it as a reference chip.</div>
            </div>
            <button class="sendButton" id="sendButton" title="Send" aria-label="Send" type="submit">${renderIcon("send")}</button>
            <button class="stopButton" hidden id="stopButton" title="Stop" aria-label="Stop" type="button">${renderIcon("stop")}</button>
          </div>
          <div class="footerBar">
            <span class="pillBadge">Local</span>
            <select class="pillControl" id="providerSelect" title="Provider" aria-label="Provider">
              <option value="ollama">Ollama</option>
              <option value="cloud-placeholder">Cloud Placeholder</option>
            </select>
            <select class="pillControl" id="modelSelect" title="Installed Models" aria-label="Installed Models"></select>
            <input
              class="pillInput"
              id="manualModelInput"
              type="text"
              placeholder="Manual model override"
              title="Manual model override"
              aria-label="Manual model override"
            />
          </div>
          <div class="composerHint" id="modelHint"></div>
        </div>
      </section>
    </div>

    <script nonce="${nonce}" id="initialState" type="application/json">${encodedState}</script>
    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      const initialState = JSON.parse(document.getElementById("initialState").textContent);
      const icons = {
        copy: ${JSON.stringify(renderIcon("copy"))},
        close: ${JSON.stringify(renderIcon("close"))}
      };

      const state = {
        taskId: initialState.taskId,
        title: initialState.title || "New Task",
        messages: initialState.messages ?? [],
        providerId: initialState.providerId || "ollama",
        model: initialState.model || "",
        availableModels: Array.from(new Set(initialState.availableModels ?? [])),
        modelHint: initialState.modelHint || "",
        attachments: initialState.attachments ?? [],
        isModelListLoading: Boolean(initialState.isModelListLoading),
        requestState: initialState.requestState || "idle",
        status: initialState.status || "Ready",
        activeRequestId: initialState.isRequestInFlight
          ? [...(initialState.messages ?? [])].reverse().find((entry) => entry.role === "assistant")?.id ?? null
          : null
      };

      const taskTitle = document.getElementById("taskTitle");
      const statusText = document.getElementById("statusText");
      const messagesNode = document.getElementById("messages");
      const attachmentRow = document.getElementById("attachmentRow");
      const attachFileButton = document.getElementById("attachFileButton");
      const promptInput = document.getElementById("promptInput");
      const sendButton = document.getElementById("sendButton");
      const stopButton = document.getElementById("stopButton");
      const providerSelect = document.getElementById("providerSelect");
      const modelSelect = document.getElementById("modelSelect");
      const manualModelInput = document.getElementById("manualModelInput");
      const modelHintNode = document.getElementById("modelHint");
      const newTaskButton = document.getElementById("newTaskButton");
      const refreshButton = document.getElementById("refreshButton");
      const clearButton = document.getElementById("clearButton");
      const settingsButton = document.getElementById("settingsButton");
      const closeTaskButton = document.getElementById("closeTaskButton");

      providerSelect.value = state.providerId;

      function createId() {
        return Date.now().toString() + "-" + Math.random().toString(16).slice(2);
      }

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

      function isBusy() {
        return (
          state.requestState === "connecting" ||
          state.requestState === "generating" ||
          state.requestState === "cancelling"
        );
      }

      function resolveModelName() {
        const manual = manualModelInput.value.trim();

        if (manual.length > 0) {
          return manual;
        }

        return modelSelect.value || state.model || "";
      }

      function insertTextAtCursor(text) {
        const start = promptInput.selectionStart;
        const end = promptInput.selectionEnd;
        const nextValue =
          promptInput.value.slice(0, start) +
          text +
          promptInput.value.slice(end);

        promptInput.value = nextValue;
        const nextCursor = start + text.length;
        promptInput.selectionStart = nextCursor;
        promptInput.selectionEnd = nextCursor;
        promptInput.dispatchEvent(new Event("input"));
      }

      function renderModels() {
        const models = Array.from(new Set(state.availableModels));
        const placeholder = '<option value="">Model</option>';

        modelSelect.innerHTML =
          placeholder +
          models
            .map((model) => {
              return '<option value="' + escapeAttribute(model) + '">' + escapeHtml(model) + "</option>";
            })
            .join("");

        const resolvedModel = state.model || resolveModelName();

        if (resolvedModel && models.includes(resolvedModel)) {
          modelSelect.value = resolvedModel;
          return;
        }

        if (models.length > 0) {
          modelSelect.value = models[0];
          if (!manualModelInput.value.trim()) {
            state.model = models[0];
          }
          return;
        }

        modelSelect.value = "";
      }

      function renderTextBlock(text) {
        const trimmed = text.replace(/^\\n+|\\n+$/g, "");

        if (!trimmed) {
          return "";
        }

        return '<div class="textBlock">' + escapeHtml(trimmed).replaceAll("\\n", "<br />") + "</div>";
      }

      function renderMessageContent(content) {
        const pattern = /\`\`\`([\\w.+-]*)\\n?([\\s\\S]*?)\`\`\`/g;
        let html = "";
        let lastIndex = 0;
        let match;

        while ((match = pattern.exec(content)) !== null) {
          html += renderTextBlock(content.slice(lastIndex, match.index));
          html +=
            '<pre class="codeBlock"><div class="codeLabel">' +
            escapeHtml(match[1] || "code") +
            '</div><code class="codeContent">' +
            escapeHtml(match[2].replace(/\\n$/, "")) +
            "</code></pre>";
          lastIndex = match.index + match[0].length;
        }

        html += renderTextBlock(content.slice(lastIndex));
        return html || renderTextBlock(content);
      }

      function renderAttachments() {
        if (state.attachments.length === 0) {
          attachmentRow.innerHTML = "";
          return;
        }

        attachmentRow.innerHTML = state.attachments
          .map((attachment) => {
            return (
              '<div class="attachmentChip">' +
              '<span class="chipLabel">' +
              escapeHtml(attachment.label) +
              "</span>" +
              '<button class="chipRemove" data-remove-attachment="' +
              escapeAttribute(attachment.id) +
              '" title="Remove Attachment" aria-label="Remove Attachment" type="button">' +
              icons.close +
              "</button>" +
              "</div>"
            );
          })
          .join("");
      }

      function renderMessages() {
        if (state.messages.length === 0) {
          messagesNode.innerHTML =
            '<div class="emptyState">' +
            '<div class="emptyTitle">Start a focused task</div>' +
            "<div>Open one conversation per task, paste selected code to create a reference chip, or attach the active file when you need broader context.</div>" +
            "</div>";
          return;
        }

        messagesNode.innerHTML = state.messages
          .map((message) => {
            const roleLabel = message.role === "user" ? "You" : "DevFlow AI";
            const modelLabel = message.role === "assistant" && message.model ? " | " + message.model : "";

            return (
              '<article class="message ' +
              escapeAttribute(message.role) +
              '">' +
              '<div class="messageHeader">' +
              '<span class="messageLabel">' +
              escapeHtml(roleLabel + modelLabel) +
              "</span>" +
              '<button class="messageAction" data-copy-message="' +
              escapeAttribute(message.id) +
              '" title="Copy Response" aria-label="Copy Response" type="button">' +
              icons.copy +
              "</button>" +
              "</div>" +
              '<div class="messageBody">' +
              renderMessageContent(message.content) +
              "</div>" +
              "</article>"
            );
          })
          .join("");

        messagesNode.scrollTop = messagesNode.scrollHeight;
      }

      function renderAll() {
        taskTitle.textContent = state.title || "New Task";
        statusText.textContent = state.status || "Ready";
        providerSelect.value = state.providerId;
        renderModels();
        renderAttachments();
        renderMessages();
        modelHintNode.textContent = state.modelHint || "";
        syncControls();
      }

      function syncControls() {
        const busy = isBusy();
        const promptIsEmpty = promptInput.value.trim().length === 0;

        attachFileButton.disabled = busy;
        providerSelect.disabled = busy;
        modelSelect.disabled = busy;
        manualModelInput.disabled = busy;
        refreshButton.disabled = busy || state.isModelListLoading;
        clearButton.disabled = busy;
        newTaskButton.disabled = false;
        closeTaskButton.disabled = false;
        settingsButton.disabled = false;
        sendButton.disabled = busy || promptIsEmpty;
        sendButton.hidden = busy;
        stopButton.hidden = !busy;
        stopButton.disabled = state.requestState === "cancelling";
        refreshButton.title = state.isModelListLoading ? "Loading Models" : "Refresh Models";
      }

      function updateStateFromPayload(message) {
        if (typeof message.taskId === "string") {
          state.taskId = message.taskId;
        }

        if (typeof message.title === "string") {
          state.title = message.title;
        }

        if (Array.isArray(message.messages)) {
          state.messages = message.messages;
        }

        if (typeof message.providerId === "string") {
          state.providerId = message.providerId;
        }

        if (typeof message.model === "string") {
          state.model = message.model;
        }

        if (Array.isArray(message.availableModels)) {
          state.availableModels = Array.from(new Set(message.availableModels));
        }

        if (typeof message.modelHint === "string") {
          state.modelHint = message.modelHint;
        }

        if (Array.isArray(message.attachments)) {
          state.attachments = message.attachments;
        }

        if (typeof message.status === "string") {
          state.status = message.status;
        }

        if (typeof message.requestState === "string") {
          state.requestState = message.requestState;
        }

        if (typeof message.isModelListLoading === "boolean") {
          state.isModelListLoading = message.isModelListLoading;
        }
      }

      function requestModels() {
        state.isModelListLoading = true;
        syncControls();
        vscode.postMessage({
          type: "loadModels",
          providerId: providerSelect.value,
          model: resolveModelName()
        });
      }

      function submitPrompt() {
        const prompt = promptInput.value.trim();

        if (!prompt || isBusy()) {
          return;
        }

        const requestId = createId();
        const userMessageId = createId();
        const model = resolveModelName();
        const providerId = providerSelect.value;

        state.activeRequestId = requestId;
        state.requestState = "connecting";
        state.status = providerId === "ollama" ? "Connecting to Ollama..." : "Connecting...";
        state.model = model || state.model;
        state.providerId = providerId;
        state.messages = [
          ...state.messages,
          {
            id: userMessageId,
            role: "user",
            content: prompt,
            createdAt: new Date().toISOString(),
            model,
            provider: providerId
          },
          {
            id: requestId,
            role: "assistant",
            content: "Thinking...",
            createdAt: new Date().toISOString(),
            model,
            provider: providerId
          }
        ];

        promptInput.value = "";
        renderAll();

        vscode.postMessage({
          type: "sendPrompt",
          requestId,
          userMessageId,
          prompt,
          providerId,
          model
        });
      }

      newTaskButton.addEventListener("click", () => {
        vscode.postMessage({ type: "newTask" });
      });

      refreshButton.addEventListener("click", requestModels);

      clearButton.addEventListener("click", () => {
        if (isBusy()) {
          return;
        }

        state.messages = [];
        state.attachments = [];
        state.activeRequestId = null;
        state.requestState = "idle";
        state.status = "Ready";
        renderAll();
        vscode.postMessage({ type: "clearChat" });
      });

      settingsButton.addEventListener("click", () => {
        vscode.postMessage({ type: "openSettings" });
      });

      closeTaskButton.addEventListener("click", () => {
        vscode.postMessage({ type: "closeTask" });
      });

      attachFileButton.addEventListener("click", () => {
        vscode.postMessage({ type: "attachActiveFile" });
      });

      providerSelect.addEventListener("change", () => {
        state.providerId = providerSelect.value;
        requestModels();
      });

      modelSelect.addEventListener("change", () => {
        state.model = modelSelect.value;
      });

      manualModelInput.addEventListener("input", () => {
        syncControls();
      });

      promptInput.addEventListener("input", () => {
        syncControls();
      });

      promptInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          submitPrompt();
        }
      });

      promptInput.addEventListener("paste", (event) => {
        const pastedText = event.clipboardData?.getData("text/plain") ?? "";

        if (!pastedText) {
          return;
        }

        const pasteId = createId();
        event.preventDefault();
        vscode.postMessage({
          type: "resolvePasteSelection",
          pasteId,
          pastedText
        });
      });

      sendButton.addEventListener("click", (event) => {
        event.preventDefault();
        submitPrompt();
      });

      stopButton.addEventListener("click", () => {
        if (!state.activeRequestId) {
          return;
        }

        state.requestState = "cancelling";
        state.status = "Cancelling...";
        syncControls();
        statusText.textContent = state.status;
        vscode.postMessage({
          type: "stopGeneration",
          requestId: state.activeRequestId
        });
      });

      attachmentRow.addEventListener("click", (event) => {
        const button = event.target.closest("[data-remove-attachment]");

        if (!button) {
          return;
        }

        vscode.postMessage({
          type: "removeAttachment",
          attachmentId: button.getAttribute("data-remove-attachment")
        });
      });

      messagesNode.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-copy-message]");

        if (!button) {
          return;
        }

        const messageId = button.getAttribute("data-copy-message");
        const message = state.messages.find((entry) => entry.id === messageId);

        if (!message) {
          return;
        }

        await navigator.clipboard.writeText(message.content);
      });

      window.addEventListener("message", (event) => {
        const message = event.data;

        if (message.type === "stateUpdated" || message.type === "modelsLoaded") {
          updateStateFromPayload(message);
          if (!state.activeRequestId && message.isRequestInFlight) {
            state.activeRequestId =
              [...(message.messages ?? [])].reverse().find((entry) => entry.role === "assistant")?.id ?? null;
          }
          renderAll();
          return;
        }

        if (message.type === "pasteSelectionResolved") {
          if (!message.attachment) {
            insertTextAtCursor(String(message.pastedText || ""));
          }
          return;
        }

        if (message.type === "streamStart") {
          if (message.requestId === state.activeRequestId) {
            state.requestState = message.requestState || "connecting";
            state.status = message.status || "Connecting...";
            syncControls();
            statusText.textContent = state.status;
          }
          return;
        }

        if (message.type === "streamChunk") {
          if (message.requestId === state.activeRequestId) {
            state.requestState = message.requestState || "generating";
            state.status = message.status || "Generating response...";
            state.messages = state.messages.map((entry) =>
              entry.id === state.activeRequestId
                ? {
                    ...entry,
                    content:
                      entry.content === "Thinking..."
                        ? String(message.chunk || "")
                        : entry.content + String(message.chunk || "")
                  }
                : entry
            );
            renderMessages();
            syncControls();
            statusText.textContent = state.status;
          }
          return;
        }

        if (message.type === "streamEnd") {
          if (message.requestId === state.activeRequestId) {
            state.requestState = message.requestState || "done";
            state.status = message.status || "Done";
            state.activeRequestId = null;
            syncControls();
            statusText.textContent = state.status;
          }
          return;
        }

        if (message.type === "streamError") {
          if (message.requestId === state.activeRequestId) {
            state.requestState = message.requestState || "error";
            state.status = message.status || "Error";
            state.messages = state.messages.map((entry) =>
              entry.id === state.activeRequestId
                ? {
                    ...entry,
                    content: String(message.errorMessage || "Error")
                  }
                : entry
            );
            state.activeRequestId = null;
            renderMessages();
            syncControls();
            statusText.textContent = state.status;
          }
          return;
        }

        if (message.type === "generationCancelled") {
          if (message.requestId === state.activeRequestId) {
            state.requestState = message.requestState || "cancelling";
            state.status = message.status || "Cancelled";

            if (message.finished) {
              if (message.replacementText) {
                state.messages = state.messages.map((entry) =>
                  entry.id === message.requestId
                    ? {
                        ...entry,
                        content: String(message.replacementText)
                      }
                    : entry
                );
                renderMessages();
              }

              state.activeRequestId = null;
            }

            syncControls();
            statusText.textContent = state.status;
          }
        }
      });

      renderAll();
      requestModels();
    </script>
  </body>
</html>`;
}
