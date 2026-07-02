import * as path from "node:path";
import * as vscode from "vscode";
import {
  CopyMode,
  type CopyTextFormatOptions,
  type SelectionSnapshot,
  buildCopyContent,
  resolveSelectedEndLine
} from "./copyLogic";
import {
  WINDOWS_COPY_PATH_FORMAT_CONFIG_KEY,
  type WindowsCopyPathFormat,
  formatFullPath,
  formatRelativePath
} from "./pathFormatter";

export { CopyMode } from "./copyLogic";

export const FILE_PREFIX_CONFIG_KEY = "copyExtra.filePrefix";
export const FILE_SUFFIX_CONFIG_KEY = "copyExtra.fileSuffix";
export const PATH_PREFIX_CONFIG_KEY = "copyExtra.pathPrefix";
export const SCOPE_SELECTED_BEFORE_LINE_COUNT_CONFIG_KEY = "copyExtra.scopeSelectedBeforeLineCount";
export const SCOPE_SELECTED_AFTER_LINE_COUNT_CONFIG_KEY = "copyExtra.scopeSelectedAfterLineCount";

export function buildEditorCopyContent(
  document: vscode.TextDocument,
  selection: vscode.Selection,
  mode: CopyMode
): string {
  const snapshot = createSelectionSnapshot(document, selection);
  const displayPath = resolveDisplayPath(document, needsRelativePath(mode));
  return buildCopyContent(displayPath, snapshot, mode, resolveCopyTextFormatOptions());
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
    lineCount: document.lineCount,
    touchedLineText
  };
}

export function resolveDisplayPath(document: vscode.TextDocument, useRelativePath: boolean): string {
  return resolveResourceDisplayPath(document.uri, useRelativePath);
}

export function resolveResourceDisplayPath(uri: vscode.Uri, useRelativePath: boolean): string {
  const absolutePath = uri.fsPath;
  const windowsCopyPathFormat = resolveWindowsCopyPathFormat();
  if (!useRelativePath) {
    return formatFullPath(absolutePath, windowsCopyPathFormat);
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (!workspaceFolder) {
    return formatFullPath(absolutePath, windowsCopyPathFormat);
  }

  const relativePath = path.relative(workspaceFolder.uri.fsPath, absolutePath);
  const displayPath = relativePath.length > 0 ? relativePath : path.basename(absolutePath);
  return formatRelativePath(displayPath, windowsCopyPathFormat);
}

export function resolveCopyTextFormatOptions(): CopyTextFormatOptions {
  const configuration = vscode.workspace.getConfiguration();
  return {
    filePrefix: configuration.get<string>(FILE_PREFIX_CONFIG_KEY, "File:"),
    fileSuffix: configuration.get<string>(FILE_SUFFIX_CONFIG_KEY, "行"),
    pathPrefix: configuration.get<string>(PATH_PREFIX_CONFIG_KEY, "Path:"),
    scopeSelectedBeforeLineCount: Math.max(
      0,
      configuration.get<number>(SCOPE_SELECTED_BEFORE_LINE_COUNT_CONFIG_KEY, 5)
    ),
    scopeSelectedAfterLineCount: Math.max(
      0,
      configuration.get<number>(SCOPE_SELECTED_AFTER_LINE_COUNT_CONFIG_KEY, 5)
    )
  };
}

function resolveWindowsCopyPathFormat(): WindowsCopyPathFormat {
  const configuredValue = vscode.workspace
    .getConfiguration()
    .get<WindowsCopyPathFormat>(WINDOWS_COPY_PATH_FORMAT_CONFIG_KEY, "default");
  return configuredValue;
}

function needsRelativePath(mode: CopyMode): boolean {
  return mode === CopyMode.RelativePathLineNumbersSelected
    || mode === CopyMode.RelativePathLineRangeSelected
    || mode === CopyMode.RelativePathAndLineRangeOnly
    || mode === CopyMode.RelativePathLineRange
    || mode === CopyMode.RelativePathLineNumbers;
}
