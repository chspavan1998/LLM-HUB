# LLM Dev Workspace - Product Plan

## Goal

Build a local-first desktop developer app that gives developers a Cursor-like chat workspace for using local and cloud LLMs.

## Core Problem

Developers often use LLMs through messy terminal sessions, browser chats, local model tools, and API playgrounds. Context, prompts, outputs, errors, and final solutions get scattered.

## MVP

The first version should support:

1. Desktop app shell
2. Left sidebar for workspaces and chats
3. Main chat window
4. Model selector
5. Ollama/local LLM provider first
6. SQLite-based local chat history
7. Settings page placeholder
8. Provider architecture for adding OpenAI, Claude, Gemini later

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

These need internet and user-provided API tokens.

## Important Principles

- Local-first
- Private by default
- API keys should never be exposed in frontend
- Provider system should be modular
- Cloud providers should be added later, not in first version
- CLI bridge should be added later, not in first version