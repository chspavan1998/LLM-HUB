import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("llmDevWorkspace", {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node
  }
});

