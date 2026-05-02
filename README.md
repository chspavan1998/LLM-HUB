# LLM Dev Workspace

Local-first desktop IDE workspace for coding with local LLM chat.

## MVP Scope

- Electron desktop shell
- React and TypeScript renderer
- Local project folder picker
- Left sidebar for file explorer, workspaces, and chats
- Monaco Editor center panel for viewing and editing files
- Right AI chat panel with model selection
- Scoped Electron IPC bridge for listing, reading, and saving project files
- Ollama provider placeholder
- SQLite placeholders for workspaces, conversations, messages, and providers

The MVP intentionally does not include OpenAI, Claude, Gemini, authentication, cloud sync, full repo indexing, or a CLI bridge.

## Setup

```bash
npm install
```

## Run The Desktop App

```bash
npm run dev
```

This command starts the Vite renderer and launches the Electron desktop shell.

## Build

```bash
npm run build
```

## Type Check

```bash
npm run typecheck
```

## Project Structure

```text
apps/desktop        Electron and React desktop app
packages/core       Shared providers, database placeholders, and domain types
docs                Product planning docs
```
