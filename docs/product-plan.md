# LLM Dev Workspace - Product Plan

## Goal

Build a VS Code extension that adds a Cursor-like LLM chat workflow inside VS Code.

VS Code already provides the editor, file explorer, terminal, Git integration, and workspace context. `llm-dev-workspace` should focus on the AI chat workflow beside the developer's existing code.

## Core Problem

Developers often use LLMs through browser chats, local model tools, and API playgrounds while coding in VS Code. The question, code context, and answer can become disconnected from the active file or selected code.

The extension should keep LLM chat close to the editor while staying lightweight and local-first.

## MVP

The first version should support:

1. VS Code Activity Bar contribution named DevFlow AI
2. Sidebar launcher for recent tasks
3. New Task command that opens a dedicated editor-tab chat
4. Message list with streamed responses
5. Prompt input with send and stop controls
6. Provider selector
7. Model selector
8. Explicit active-file attachment
9. Copy-paste selection attachment that becomes a reference chip
10. Ollama provider for local offline models
11. Cloud provider placeholder only
12. Active editor file context
13. Selected text context
14. In-memory task history only for now
15. Secrets stored through VS Code SecretStorage
16. Non-secret settings stored through VS Code configuration/state

## Commands

- DevFlow AI: Open Chat
- DevFlow AI: New Task
- DevFlow AI: Set Ollama URL
- DevFlow AI: Set API Key Placeholder
- DevFlow AI: Clear Chat

## Provider Direction

### Ollama

Ollama is the first implemented provider.

- Default URL: `http://localhost:11434`
- Uses the local Ollama chat API
- Reads model name from extension settings
- Handles connection failures with clear user-facing errors

### Cloud Providers

OpenAI, Claude, Gemini, and similar providers are future work. The MVP may include a placeholder provider interface, but it must not implement cloud requests yet.

## Context Direction

The MVP should send only explicit editor context:

- Active file content when the user explicitly attaches the active file
- Selected text when the user pastes selected code into the chat and it resolves to the current editor selection

## UI Direction

- Keep the Activity Bar view lightweight and launcher-focused.
- Open each task in its own VS Code editor tab using a WebviewPanel.
- Use icon-first actions with tooltips:
  - New Task
  - Refresh Models
  - Clear Chat
  - Settings
  - Close Task
  - Attach Active File
  - Send
  - Stop
  - Copy Response
- Keep controls subtle and VS Code-native, with model and provider controls placed near the composer instead of in a large form block.
- Render pasted editor selections as small context chips with file name and line range.

Repo indexing, background embedding, file editing, code apply, and diff flows are out of scope for this version.

## Security Principles

- Keep webview code isolated from raw Node APIs
- Do not put API keys in webview code
- Use VS Code SecretStorage for secrets
- Use VS Code configuration/state for non-secret preferences
- Keep local Ollama support private by default

## Out Of Scope For MVP

- Electron desktop app
- Custom IDE UI
- Monaco Editor
- OpenAI, Claude, Gemini implementations
- Authentication
- Cloud sync
- Repo indexing
- File editing
- Code apply or diff application
- CLI bridge
