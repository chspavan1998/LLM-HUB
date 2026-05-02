# AGENTS.md

## Project

We are building `llm-dev-workspace`, a local-first desktop developer app.

The app should give developers a Cursor-like chat interface for using local and cloud LLMs in a clean project-based workspace.

## Tech Direction

Use:

- Electron
- React
- TypeScript
- Node.js
- SQLite
- Ollama integration first

Avoid adding OpenAI, Claude, Gemini, authentication, teams, cloud sync, billing, or complex repo indexing in the first MVP.

## Coding Guidelines

- Keep architecture modular.
- Use TypeScript everywhere possible.
- Keep provider logic separated from UI.
- Do not put API keys in frontend code.
- Prefer simple readable code over over-engineering.
- Add comments only where useful.
- Keep the app local-first.

## Initial Folder Direction

Target structure:

```text
apps/desktop
packages/core
docs