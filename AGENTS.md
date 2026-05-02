# AGENTS.md

## Project

We are building `llm-dev-workspace`, a local-first desktop developer app.

The app should be a lightweight Cursor-style IDE where developers can open a local project folder, view and edit files, and chat with selected LLMs beside the code.

## Tech Direction

Use:

- Electron
- React
- TypeScript
- Node.js
- SQLite
- Monaco Editor
- Ollama integration first

Avoid adding OpenAI, Claude, Gemini, authentication, teams, cloud sync, billing, full repo indexing, or a CLI bridge in the first MVP.

## Coding Guidelines

- Keep architecture modular.
- Use TypeScript everywhere possible.
- Keep provider logic separated from UI.
- Do not put API keys in frontend code.
- Do not expose raw Node APIs directly to renderer code.
- Keep file access scoped to the selected local project folder.
- Prefer simple readable code over over-engineering.
- Add comments only where useful.
- Keep the app local-first.

## Initial Folder Direction

Target structure:

```text
apps/desktop
packages/core
docs
