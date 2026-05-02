export {};

declare global {
  interface Window {
    llmDevWorkspace?: {
      platform: NodeJS.Platform;
      versions: {
        electron: string;
        node: string;
      };
    };
  }
}

