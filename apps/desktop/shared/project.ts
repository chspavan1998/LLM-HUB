export type ProjectTreeNodeType = "directory" | "file";

export interface ProjectTreeNode {
  name: string;
  relativePath: string;
  type: ProjectTreeNodeType;
  children?: ProjectTreeNode[];
}

export interface ProjectFolder {
  name: string;
  rootPath: string;
  tree: ProjectTreeNode[];
}

export interface ProjectFile {
  fileName: string;
  relativePath: string;
  content: string;
}

export interface SaveProjectFileResult {
  relativePath: string;
  saved: boolean;
  savedAt: string;
}

export interface ProjectApi {
  selectProjectFolder(): Promise<ProjectFolder | null>;
  listProjectTree(): Promise<ProjectTreeNode[]>;
  readProjectFile(relativePath: string): Promise<ProjectFile>;
  saveProjectFile(
    relativePath: string,
    content: string
  ): Promise<SaveProjectFileResult>;
}

