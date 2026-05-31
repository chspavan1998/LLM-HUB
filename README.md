# DevFlow AI

VS Code extension that adds a Cursor-style LLM task workflow inside VS Code.

The current UI uses a lightweight sidebar launcher plus dedicated editor-tab task chats. It uses Ollama first for local offline models.

## Features

- Activity Bar launcher named DevFlow AI
- New Task command that opens chat in an editor tab
- Streaming chat responses with stop/cancel
- Provider selector
- Model selector
- Paste selected code from the editor to create a context chip
- Attach active file explicitly from the composer
- Ollama chat provider
- Cloud provider placeholder only
- SecretStorage command for future API keys
- In-memory task tabs only for now

## Run In Extension Development Host

1. Install dependencies:

```bash
npm install
```

2. Compile:

```bash
npm run compile
```

3. Open this repo in VS Code and press `F5`.

This starts an Extension Development Host window. Open the DevFlow AI Activity Bar view to launch tasks, or run `DevFlow AI: New Task`.

## Development Commands

```bash
npm run compile
npm run watch
npm run typecheck
```

## Use Ollama Locally

1. Install Ollama from `https://ollama.com`.
2. Start Ollama.
3. Pull a model, for example:

```bash
ollama pull llama3.2
```

4. In VS Code settings, set:

```json
{
  "devflowAI.provider": "ollama",
  "devflowAI.ollama.baseUrl": "http://localhost:11434",
  "devflowAI.ollama.model": "llama3.2"
}
```

You can also run `DevFlow AI: Set Ollama URL` from the Command Palette.

## Commands

- `DevFlow AI: Open Chat`
- `DevFlow AI: New Task`
- `DevFlow AI: Set Ollama URL`
- `DevFlow AI: Set API Key Placeholder`
- `DevFlow AI: Clear Chat`

## Context

The chat can include:

- The active editor file, attached explicitly from the composer
- The current editor selection, attached when you paste selected code into the chat window

The extension does not index the repository in this MVP.

## Future Plan

- OpenAI provider
- Claude provider
- Gemini provider
- Saved chat history
- Code apply and diff workflows

OpenAI, Claude, and Gemini are not implemented yet.
