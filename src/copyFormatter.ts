import * as path from "node:path";
import * as vscode from "vscode";
import { CopyMode, type SelectionSnapshot, buildCopyContent, resolveSelectedEndLine } from "./copyLogic";

export { CopyMode } from "./copyLogic";

export function buildEditorCopyContent(
  document: vscode.TextDocument,
  selection: vscode.Selection,
  mode: CopyMode
): string {
  const snapshot = createSelectionSnapshot(document, selection);
  const displayPath = resolveDisplayPath(document, needsRelativePath(mode));
  return buildCopyContent(displayPath, snapshot, mode);
}

export function createSelectionSnapshot(
  document: vscode.TextDocument,
  selection: vscode.Selection
): SelectionSnapshot {
  const documentText = document.getText();
  const selectedText = document.getText(selection);
  const selectionStartOffset = document.offsetAt(selection.start);
  const startLine = selection.start.line;
  const endLine = resolveSelectedEndLine(documentText, selectionStartOffset, selectedText, document.lineCount);
  const lineStartOffset = document.offsetAt(new vscode.Position(startLine, 0));
  const lineEndOffset = document.offsetAt(document.lineAt(endLine).range.end);
  const touchedLineText = documentText.slice(lineStartOffset, lineEndOffset);

  return {
    selectedText,
    startLine,
    endLine,
    touchedLineText
  };
}

export function resolveDisplayPath(document: vscode.TextDocument, useRelativePath: boolean): string {
  const absolutePath = document.uri.fsPath;
  if (!useRelativePath) {
    return absolutePath;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!workspaceFolder) {
    return absolutePath;
  }

  const relativePath = path.relative(workspaceFolder.uri.fsPath, absolutePath);
  return relativePath.length > 0 ? relativePath : path.basename(absolutePath);
}

function needsRelativePath(mode: CopyMode): boolean {
  return mode === CopyMode.RelativePathLineNumbersSelected
    || mode === CopyMode.RelativePathLineRangeSelected
    || mode === CopyMode.RelativePathAndLineRangeOnly
    || mode === CopyMode.RelativePathLineRange
    || mode === CopyMode.RelativePathLineNumbers;
}
