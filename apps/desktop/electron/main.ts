import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import type { OpenDialogOptions } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type ProjectTreeNodeType = "directory" | "file";

interface ProjectTreeNode {
  name: string;
  relativePath: string;
  type: ProjectTreeNodeType;
  children?: ProjectTreeNode[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const ignoredDirectoryNames = new Set([
  ".git",
  "dist",
  "dist-electron",
  "node_modules"
]);
const maxTreeDepth = 8;
const maxTreeEntries = 2000;
const maxFileBytes = 1024 * 1024;

let selectedProjectRoot: string | null = null;

function isInsideProject(rootPath: string, targetPath: string): boolean {
  const relativePath = path.relative(rootPath, targetPath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

function normalizeRelativePath(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}

function requireProjectPath(relativePath: string): string {
  if (!selectedProjectRoot) {
    throw new Error("No project folder has been selected.");
  }

  if (!relativePath || relativePath.includes("\0")) {
    throw new Error("Invalid project file path.");
  }

  const targetPath = path.resolve(selectedProjectRoot, relativePath);

  if (!isInsideProject(selectedProjectRoot, targetPath)) {
    throw new Error("File access must stay inside the selected project folder.");
  }

  return targetPath;
}

async function readProjectTree(
  directoryPath: string,
  rootPath: string,
  depth: number,
  entryState: { count: number }
): Promise<ProjectTreeNode[]> {
  if (depth < 0 || entryState.count >= maxTreeEntries) {
    return [];
  }

  const directoryEntries = await fs.readdir(directoryPath, {
    withFileTypes: true
  });

  const visibleEntries = directoryEntries
    .filter((entry) => !entry.name.startsWith(".") || entry.name === ".env")
    .filter((entry) => !ignoredDirectoryNames.has(entry.name))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) {
        return -1;
      }

      if (!a.isDirectory() && b.isDirectory()) {
        return 1;
      }

      return a.name.localeCompare(b.name);
    });

  const nodes: ProjectTreeNode[] = [];

  for (const entry of visibleEntries) {
    if (entryState.count >= maxTreeEntries) {
      break;
    }

    const absolutePath = path.join(directoryPath, entry.name);
    const relativePath = normalizeRelativePath(path.relative(rootPath, absolutePath));

    if (!isInsideProject(rootPath, absolutePath)) {
      continue;
    }

    entryState.count += 1;

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        relativePath,
        type: "directory",
        children: await readProjectTree(
          absolutePath,
          rootPath,
          depth - 1,
          entryState
        )
      });
      continue;
    }

    if (entry.isFile()) {
      nodes.push({
        name: entry.name,
        relativePath,
        type: "file"
      });
    }
  }

  return nodes;
}

async function getSelectedProjectTree(): Promise<ProjectTreeNode[]> {
  if (!selectedProjectRoot) {
    return [];
  }

  return readProjectTree(selectedProjectRoot, selectedProjectRoot, maxTreeDepth, {
    count: 0
  });
}

function registerProjectIpc(): void {
  ipcMain.handle("project:select-folder", async (event) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: OpenDialogOptions = {
      title: "Open Project Folder",
      properties: ["openDirectory"]
    };
    const result = browserWindow
      ? await dialog.showOpenDialog(browserWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    selectedProjectRoot = path.resolve(result.filePaths[0] as string);

    return {
      name: path.basename(selectedProjectRoot),
      rootPath: selectedProjectRoot,
      tree: await getSelectedProjectTree()
    };
  });

  ipcMain.handle("project:list-tree", async () => getSelectedProjectTree());

  ipcMain.handle("project:read-file", async (_event, relativePath: string) => {
    const filePath = requireProjectPath(relativePath);
    const fileStats = await fs.stat(filePath);

    if (!fileStats.isFile()) {
      throw new Error("Only project files can be opened in the editor.");
    }

    if (fileStats.size > maxFileBytes) {
      throw new Error("This file is too large for the MVP editor.");
    }

    return {
      fileName: path.basename(filePath),
      relativePath: normalizeRelativePath(path.relative(selectedProjectRoot as string, filePath)),
      content: await fs.readFile(filePath, "utf8")
    };
  });

  ipcMain.handle(
    "project:save-file",
    async (_event, relativePath: string, content: string) => {
      const filePath = requireProjectPath(relativePath);
      const parentPath = path.dirname(filePath);

      if (!isInsideProject(selectedProjectRoot as string, parentPath)) {
        throw new Error("Save target must stay inside the selected project folder.");
      }

      await fs.writeFile(filePath, content, "utf8");

      return {
        relativePath: normalizeRelativePath(
          path.relative(selectedProjectRoot as string, filePath)
        ),
        saved: true,
        savedAt: new Date().toISOString()
      };
    }
  );
}

function createMainWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1040,
    minHeight: 700,
    title: "LLM Dev Workspace",
    backgroundColor: "#12100f",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

registerProjectIpc();

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
