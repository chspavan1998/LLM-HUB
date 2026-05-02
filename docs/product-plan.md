# LLM Dev Workspace - Product Plan

## Goal

Build a local-first lightweight Cursor-style IDE where developers can open a local project folder, view and edit code files, and chat with selected LLMs beside the code.

## Core Problem

Developers often move between code editors, browser chats, terminal sessions, local model tools, and API playgrounds. Project context, prompts, outputs, errors, and final solutions get scattered.

`llm-dev-workspace` should keep the code and AI conversation together in one private desktop workspace.

## MVP

The first version should support:

1. Desktop app shell
2. Opening a local project folder
3. Project/file explorer
4. Monaco-based code editor/viewer
5. Viewing and editing local file content
6. Save action through scoped Electron IPC
7. Workspace/chat history section
8. AI chat panel beside the code
9. Model selector
10. Include-active-file-as-context indicator
11. Ollama/local LLM provider placeholder
12. SQLite placeholders for workspaces, conversations, messages, and providers

## Layout

### Left Panel

- Project/file explorer
- Open project folder action
- Workspace/chat history section

### Center Panel

- Monaco Editor
- Active file tab/header
- Editable file content
- Save button with scoped file access

### Right Panel

- AI chat panel
- Model selector
- Message history
- Prompt input
- Active file context toggle/indicator

## Model Types

### Local Models

Examples:
- Ollama
- Llama.cpp
- LM Studio

These can run offline after setup/model download.

### Cloud Models

Examples:
- OpenAI
- Claude
- Gemini
- OpenRouter

Cloud providers need internet and user-provided API tokens. They should be added later, not in the first MVP.

## Security Principles

- Local-first
- Private by default
- Renderer code must not receive raw Node APIs
- File access must go through preload IPC methods
- File reads and writes must stay scoped to the selected project folder
- API keys should never be exposed in frontend code
- Provider system should be modular

## Out Of Scope For MVP

- OpenAI, Claude, Gemini, or other cloud providers
- Authentication
- Teams
- Cloud sync
- Billing
- Full repo indexing
- CLI bridge
