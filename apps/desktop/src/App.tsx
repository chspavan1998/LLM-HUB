import type { LlmModel } from "@llm-dev-workspace/core";
import { Settings, Sparkles } from "lucide-react";

const workspaces = [
  { id: "local", name: "Local Workspace", path: "~/projects/llm-dev-workspace" },
  { id: "scratch", name: "Scratchpad", path: "Private notes" }
];

const chats = [
  { id: "mvp", title: "MVP scaffold", time: "Today" },
  { id: "ollama", title: "Ollama setup", time: "Draft" }
];

const models: LlmModel[] = [
  {
    id: "llama3.2",
    name: "llama3.2",
    providerId: "ollama",
    isLocal: true
  },
  {
    id: "codellama",
    name: "codellama",
    providerId: "ollama",
    isLocal: true
  }
];

const messages = [
  {
    role: "assistant",
    content:
      "This MVP shell is ready for local-first chat. Ollama is the first provider target, with persistence reserved for SQLite."
  },
  {
    role: "user",
    content: "Create a clean chat workspace for developer prompts."
  }
];

export function App() {
  return (
    <div className="appShell">
      <aside className="sidebar" aria-label="Workspace navigation">
        <div className="brand">
          <div className="brandMark">LW</div>
          <div>
            <strong>LLM Dev Workspace</strong>
            <span>Local-first chat</span>
          </div>
        </div>

        <section className="sidebarSection">
          <div className="sectionLabel">Workspaces</div>
          <div className="navList">
            {workspaces.map((workspace, index) => (
              <button
                className={`navItem ${index === 0 ? "active" : ""}`}
                key={workspace.id}
                type="button"
              >
                <span>{workspace.name}</span>
                <small>{workspace.path}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="sidebarSection">
          <div className="sectionLabel">Chats</div>
          <div className="navList">
            {chats.map((chat) => (
              <button className="chatItem" key={chat.id} type="button">
                <span>{chat.title}</span>
                <small>{chat.time}</small>
              </button>
            ))}
          </div>
        </section>

        <button className="settingsButton" type="button">
          <Settings size={17} />
          <span>Settings</span>
        </button>
      </aside>

      <main className="workspacePanel">
        <header className="topBar">
          <div>
            <p className="eyebrow">Current chat</p>
            <h1>MVP scaffold</h1>
          </div>

          <label className="modelSelector">
            <span>Model</span>
            <select defaultValue={models[0]?.id}>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.providerId}: {model.name}
                </option>
              ))}
            </select>
          </label>
        </header>

        <section className="chatPanel" aria-label="Chat messages">
          <div className="statusStrip">
            <span className="statusDot" />
            <span>Ollama provider placeholder</span>
          </div>

          <div className="messageList">
            {messages.map((message, index) => (
              <article className={`message ${message.role}`} key={index}>
                <div className="avatar">
                  {message.role === "assistant" ? <Sparkles size={16} /> : "U"}
                </div>
                <p>{message.content}</p>
              </article>
            ))}
          </div>

          <form className="composer">
            <textarea
              aria-label="Message"
              placeholder="Ask a local model about this workspace..."
              rows={3}
            />
            <button type="submit">Send</button>
          </form>
        </section>
      </main>

      <aside className="settingsPanel" aria-label="Settings placeholder">
        <p className="eyebrow">Settings</p>
        <h2>Local runtime</h2>
        <dl>
          <div>
            <dt>Provider</dt>
            <dd>Ollama</dd>
          </div>
          <div>
            <dt>Database</dt>
            <dd>SQLite placeholder</dd>
          </div>
          <div>
            <dt>Sync</dt>
            <dd>Local only</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
