# AGENTS.md

## Project

We are building `llm-dev-workspace`, now branded in-product as `DevFlow AI`.

The project is a VS Code extension that adds a Cursor-like LLM chat view inside VS Code. VS Code already provides the IDE, editor, explorer, terminal, Git, and project context, so this extension should focus only on the LLM chat experience.

## Tech Direction

Use:

- VS Code Extension API
- TypeScript
- VS Code Webview View
- Ollama integration first
- VS Code SecretStorage for secrets
- VS Code configuration, globalState, or workspaceState for non-secret data

Avoid:

- Electron
- Custom IDE shells
- Monaco Editor in this repo
- OpenAI, Claude, Gemini implementations in the MVP
- Authentication
- Cloud sync
- Repo indexing
- File editing, code apply, or diff application
- CLI bridge

## Coding Guidelines

- Keep architecture modular.
- Use TypeScript everywhere possible.
- Keep provider logic separated from webview/UI logic.
- Do not put API keys in webview code.
- Do not expose raw Node APIs to the webview.
- Use VS Code APIs for editor context, secrets, configuration, and state.
- Prefer simple readable code over over-engineering.
- Add comments only where useful.
- Keep the first version focused on chat plus active file/selection context.

## Target Structure

```text
src
media
docs
```

