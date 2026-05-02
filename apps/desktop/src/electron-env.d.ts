import type { ProjectApi } from "../shared/project";

export {};

declare global {
  interface Window {
    llmDevWorkspace?: {
      platform: string;
      versions: {
        electron: string;
        node: string;
      };
      project: ProjectApi;
    };
  }
}
