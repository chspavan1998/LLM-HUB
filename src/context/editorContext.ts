import * as vscode from "vscode";
import type { ChatContextAttachment, EditorContext } from "../types";

function getRelativePath(document: vscode.TextDocument): string {
  return vscode.workspace.asRelativePath(document.uri, false);
}

function getFileName(document: vscode.TextDocument): string {
  const relativePath = getRelativePath(document);
  const parts = relativePath.split(/[\\/]/);
  return parts.at(-1) ?? relativePath;
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function captureSelectionAttachmentFromEditor(
  pastedText: string,
  editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor
): ChatContextAttachment | null {
  if (!editor || pastedText.trim().length === 0) {
    return null;
  }

  const document = editor.document;
  const selection = editor.selection;
  const selectedText = document.getText(selection);

  if (selectedText.trim().length === 0 || selectedText !== pastedText) {
    return null;
  }

  return {
    id: createId(),
    kind: "selection",
    label: `${getFileName(document)}:${selection.start.line + 1}-${selection.end.line + 1}`,
    fileName: getFileName(document),
    filePath: getRelativePath(document),
    languageId: document.languageId,
    startLine: selection.start.line + 1,
    endLine: selection.end.line + 1,
    content: selectedText
  };
}

export function captureActiveFileAttachment(
  editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor
): ChatContextAttachment | null {
  if (!editor) {
    return null;
  }

  const document = editor.document;

  return {
    id: createId(),
    kind: "active-file",
    label: `Active file: ${getFileName(document)}`,
    fileName: getFileName(document),
    filePath: getRelativePath(document),
    languageId: document.languageId,
    content: document.getText()
  };
}

export function buildEditorContextFromAttachments(
  attachments: ChatContextAttachment[]
): EditorContext {
  const context: EditorContext = {};
  const activeFile = attachments.find((attachment) => attachment.kind === "active-file");
  const selection = attachments.find((attachment) => attachment.kind === "selection");

  if (activeFile) {
    context.activeFile = {
      fileName: activeFile.fileName,
      filePath: activeFile.filePath,
      languageId: activeFile.languageId,
      content: activeFile.content
    };
  }

  if (selection && selection.startLine && selection.endLine) {
    context.selection = {
      fileName: selection.fileName,
      filePath: selection.filePath,
      languageId: selection.languageId,
      startLine: selection.startLine,
      endLine: selection.endLine,
      content: selection.content
    };
  }

  return context;
}
