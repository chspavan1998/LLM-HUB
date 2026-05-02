# LLM Dev Workspace

Local-first desktop developer workspace for chatting with local LLMs.

## MVP Scope

- Electron desktop shell
- React and TypeScript renderer
- Left sidebar for workspaces and chats
- Main chat panel with model selection
- Ollama provider placeholder
- SQLite chat history placeholder

The MVP intentionally does not include OpenAI, Claude, Gemini, authentication, cloud sync, or a CLI bridge.

## Setup

```bash
npm install
```

## Run The Desktop App

```bash
npm run dev
```

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
