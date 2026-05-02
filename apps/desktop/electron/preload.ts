import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("llmDevWorkspace", {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node
  },
  project: {
    selectProjectFolder: () => ipcRenderer.invoke("project:select-folder"),
    listProjectTree: () => ipcRenderer.invoke("project:list-tree"),
    readProjectFile: (relativePath: string) =>
      ipcRenderer.invoke("project:read-file", relativePath),
    saveProjectFile: (relativePath: string, content: string) =>
      ipcRenderer.invoke("project:save-file", relativePath, content)
  }
});
