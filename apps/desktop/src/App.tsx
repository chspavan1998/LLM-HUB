import Editor from "@monaco-editor/react";
import type { LlmModel } from "@llm-dev-workspace/core";
import type { ProjectFile, ProjectFolder, ProjectTreeNode } from "../shared/project";
import type { FormEvent } from "react";
import {
  Bot,
  Check,
  ChevronRight,
  Circle,
  File,
  Folder,
  FolderOpen,
  MessageSquare,
  Paperclip,
  Save,
  Settings
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const chats = [
  { id: "mvp", title: "MVP shell", time: "Today" },
  { id: "ollama", title: "Ollama wiring", time: "Draft" },
  { id: "editor", title: "Editor context", time: "New" }
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

interface ChatMessageView {
  role: "assistant" | "user";
  content: string;
}

const initialMessages: ChatMessageView[] = [
  {
    role: "assistant",
    content:
      "Open a local project folder, pick a file, and include it as context when you chat with the selected local model."
  }
];

const languageByExtension = new Map<string, string>([
  ["css", "css"],
  ["html", "html"],
  ["js", "javascript"],
  ["json", "json"],
  ["jsx", "javascript"],
  ["md", "markdown"],
  ["ts", "typescript"],
  ["tsx", "typescript"],
  ["xml", "xml"],
  ["yaml", "yaml"],
  ["yml", "yaml"]
]);

function getFileLanguage(fileName?: string): string {
  const extension = fileName?.split(".").pop()?.toLowerCase();
  return (extension && languageByExtension.get(extension)) || "plaintext";
}

function getFileName(relativePath?: string): string {
  if (!relativePath) {
    return "No file open";
  }

  return relativePath.split("/").pop() || relativePath;
}

interface FileTreeProps {
  activePath?: string;
  nodes: ProjectTreeNode[];
  onOpenFile: (node: ProjectTreeNode) => void;
  level?: number;
}

function FileTree({ activePath, nodes, onOpenFile, level = 0 }: FileTreeProps) {
  return (
    <div className="fileTree">
      {nodes.map((node) => {
        const isDirectory = node.type === "directory";
        const isActive = activePath === node.relativePath;

        return (
          <div key={node.relativePath || node.name}>
            <button
              className={`fileTreeItem ${isActive ? "active" : ""}`}
              onClick={() => {
                if (!isDirectory) {
                  onOpenFile(node);
                }
              }}
              style={{ paddingLeft: `${10 + level * 14}px` }}
              type="button"
            >
              {isDirectory ? <ChevronRight size={13} /> : <span className="treeSpacer" />}
              {isDirectory ? <Folder size={15} /> : <File size={15} />}
              <span>{node.name}</span>
            </button>

            {isDirectory && node.children && node.children.length > 0 ? (
              <FileTree
                activePath={activePath}
                nodes={node.children}
                onOpenFile={onOpenFile}
                level={level + 1}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function App() {
  const [project, setProject] = useState<ProjectFolder | null>(null);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [editorValue, setEditorValue] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [includeActiveFile, setIncludeActiveFile] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Choose a project folder");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages);

  const projectApi = window.llmDevWorkspace?.project;
  const activeLanguage = useMemo(
    () => getFileLanguage(activeFile?.fileName),
    [activeFile?.fileName]
  );

  const handleOpenProject = useCallback(async () => {
    if (!projectApi) {
      setStatusMessage("Desktop project bridge is unavailable.");
      return;
    }

    const selectedProject = await projectApi.selectProjectFolder();

    if (!selectedProject) {
      return;
    }

    setProject(selectedProject);
    setActiveFile(null);
    setEditorValue("");
    setIsDirty(false);
    setStatusMessage(`Opened ${selectedProject.name}`);
  }, [projectApi]);

  const handleOpenFile = useCallback(
    async (node: ProjectTreeNode) => {
      if (!projectApi || node.type !== "file") {
        return;
      }

      try {
        const file = await projectApi.readProjectFile(node.relativePath);
        setActiveFile(file);
        setEditorValue(file.content);
        setIsDirty(false);
        setStatusMessage(`Opened ${file.relativePath}`);
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Unable to open file.");
      }
    },
    [projectApi]
  );

  const handleSaveFile = useCallback(async () => {
    if (!projectApi || !activeFile) {
      setStatusMessage("Open a project file before saving.");
      return;
    }

    try {
      await projectApi.saveProjectFile(activeFile.relativePath, editorValue);
      setActiveFile({ ...activeFile, content: editorValue });
      setIsDirty(false);
      setStatusMessage(`Saved ${activeFile.relativePath}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to save file.");
    }
  }, [activeFile, editorValue, projectApi]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSaveFile();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveFile]);

  function handlePromptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    const contextNote =
      includeActiveFile && activeFile
        ? `\n\nContext attached: ${activeFile.relativePath}`
        : "";

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", content: `${trimmedPrompt}${contextNote}` },
      {
        role: "assistant",
        content:
          "Ollama chat execution is still a placeholder in this MVP shell."
      }
    ]);
    setPrompt("");
  }

  return (
    <div className="ideShell">
      <aside className="leftPanel" aria-label="Project and chat navigation">
        <div className="brand">
          <div className="brandMark">LW</div>
          <div>
            <strong>LLM Dev Workspace</strong>
            <span>Local IDE shell</span>
          </div>
        </div>

        <button className="openProjectButton" onClick={handleOpenProject} type="button">
          <FolderOpen size={17} />
          <span>Open Project</span>
        </button>

        <section className="panelSection explorerSection">
          <div className="sectionHeader">
            <span>Explorer</span>
            {project ? <small>{project.name}</small> : null}
          </div>

          {project ? (
            <FileTree
              activePath={activeFile?.relativePath}
              nodes={project.tree}
              onOpenFile={handleOpenFile}
            />
          ) : (
            <div className="emptyState">No folder selected.</div>
          )}
        </section>

        <section className="panelSection historySection">
          <div className="sectionHeader">
            <span>Workspace</span>
            <small>Chats</small>
          </div>

          <div className="chatHistory">
            {chats.map((chat, index) => (
              <button
                className={`historyItem ${index === 0 ? "active" : ""}`}
                key={chat.id}
                type="button"
              >
                <MessageSquare size={14} />
                <span>{chat.title}</span>
                <small>{chat.time}</small>
              </button>
            ))}
          </div>
        </section>

        <button className="settingsButton" type="button">
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </aside>

      <div className="columnHandle" aria-hidden="true" />

      <main className="editorPanel">
        <header className="editorHeader">
          <div className="tabBar">
            <div className={`activeTab ${isDirty ? "dirty" : ""}`}>
              <File size={15} />
              <span>{getFileName(activeFile?.relativePath)}</span>
              {isDirty ? <Circle size={8} fill="currentColor" /> : null}
            </div>
          </div>

          <div className="editorActions">
            <span className="statusText">{statusMessage}</span>
            <button
              className="iconTextButton"
              disabled={!activeFile}
              onClick={handleSaveFile}
              type="button"
            >
              <Save size={15} />
              <span>Save</span>
            </button>
          </div>
        </header>

        <section className="editorSurface" aria-label="Code editor">
          {activeFile ? (
            <Editor
              height="100%"
              language={activeLanguage}
              onChange={(value) => {
                setEditorValue(value ?? "");
                setIsDirty((value ?? "") !== activeFile.content);
              }}
              options={{
                fontFamily:
                  "JetBrains Mono, Consolas, 'Liberation Mono', monospace",
                fontSize: 13,
                minimap: { enabled: false },
                padding: { top: 18 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                wordWrap: "on"
              }}
              path={activeFile.relativePath}
              theme="vs-dark"
              value={editorValue}
            />
          ) : (
            <div className="editorEmpty">
              <FolderOpen size={28} />
              <h1>Open a file to start</h1>
              <p>Select a project folder, then choose a file from the explorer.</p>
            </div>
          )}
        </section>
      </main>

      <div className="columnHandle" aria-hidden="true" />

      <aside className="chatPanel" aria-label="AI chat">
        <header className="chatHeader">
          <div>
            <p className="eyebrow">AI Chat</p>
            <h2>Assistant</h2>
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

        <button
          className={`contextButton ${includeActiveFile && activeFile ? "active" : ""}`}
          disabled={!activeFile}
          onClick={() => setIncludeActiveFile((current) => !current)}
          type="button"
        >
          {includeActiveFile && activeFile ? <Check size={15} /> : <Paperclip size={15} />}
          <span>
            {activeFile
              ? `Include ${getFileName(activeFile.relativePath)}`
              : "No active file"}
          </span>
        </button>

        <div className="messages">
          {messages.map((message, index) => (
            <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
              <div className="avatar">
                {message.role === "assistant" ? <Bot size={15} /> : "U"}
              </div>
              <p>{message.content}</p>
            </article>
          ))}
        </div>

        <form className="promptBox" onSubmit={handlePromptSubmit}>
          <textarea
            aria-label="Prompt"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask about the active file or project..."
            rows={4}
            value={prompt}
          />
          <button type="submit">Send</button>
        </form>
      </aside>
    </div>
  );
}
