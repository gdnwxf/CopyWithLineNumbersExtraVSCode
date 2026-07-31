import * as path from "node:path";
import * as vscode from "vscode";
import {
  buildEditorCopyContent,
  CopyMode,
  resolveCopyTextFormatOptions,
  resolveResourceDisplayPath
} from "./copyFormatter";
import { buildExplorerCopyContentFromEntries, type ExplorerCopyEntry, type ExplorerResourcePrefix } from "./copyLogic";

interface RegisteredCommand {
  readonly id: string;
  readonly mode: CopyMode;
}

interface RegisteredExplorerCommand {
  readonly id: string;
  readonly useRelativePath: boolean;
}

const REGISTERED_COMMANDS: readonly RegisteredCommand[] = [
  { id: "copyExtra.copyFullPathAndLineRangeOnly", mode: CopyMode.FullPathAndLineRangeOnly },
  { id: "copyExtra.copyRelativePathAndLineRangeOnly", mode: CopyMode.RelativePathAndLineRangeOnly },
  { id: "copyExtra.copyFullPathLineRangeScopeSelected", mode: CopyMode.FullPathLineRangeScopeSelected },
  { id: "copyExtra.copyFullPathLineRangeSelected", mode: CopyMode.FullPathLineRangeSelected },
  { id: "copyExtra.copyFullPathLineNumbersSelected", mode: CopyMode.FullPathLineNumbersSelected },
  { id: "copyExtra.copyRelativePathLineRangeSelected", mode: CopyMode.RelativePathLineRangeSelected },
  { id: "copyExtra.copyRelativePathLineNumbersSelected", mode: CopyMode.RelativePathLineNumbersSelected },
  { id: "copyExtra.copyFullPathLineRange", mode: CopyMode.FullPathLineRange },
  { id: "copyExtra.copyFullPathLineNumbers", mode: CopyMode.FullPathLineNumbers },
  { id: "copyExtra.copyRelativePathLineRange", mode: CopyMode.RelativePathLineRange },
  { id: "copyExtra.copyRelativePathLineNumbers", mode: CopyMode.RelativePathLineNumbers }
] as const;

const REGISTERED_EXPLORER_COMMANDS: readonly RegisteredExplorerCommand[] = [
  { id: "copyExtra.copyExplorerRelativePath", useRelativePath: true },
  { id: "copyExtra.copyExplorerFullPath", useRelativePath: false }
] as const;

const REGISTERED_SCM_FOLDER_COMMANDS: readonly RegisteredExplorerCommand[] = [
  { id: "copyExtra.copyScmFolderRelativePath", useRelativePath: true },
  { id: "copyExtra.copyScmFolderFullPath", useRelativePath: false }
] as const;

export function activate(context: vscode.ExtensionContext): void {
  for (const command of REGISTERED_COMMANDS) {
    context.subscriptions.push(
      vscode.commands.registerTextEditorCommand(command.id, async (editor) => {
        const selection = editor.selection;
        if (selection.isEmpty && requiresSelection(command.mode)) {
          void vscode.window.showInformationMessage("Copy Extra requires a non-empty selection.");
          return;
        }

        const content = buildEditorCopyContent(editor.document, selection, command.mode);
        await vscode.env.clipboard.writeText(content);
        void vscode.window.setStatusBarMessage("Copy Extra copied to clipboard.", 2000);
      })
    );
  }

  for (const command of REGISTERED_EXPLORER_COMMANDS) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command.id, async (
        resource: unknown,
        selectedResources: readonly unknown[] | undefined
      ) => {
        const resources = resolveExplorerResources(resource, selectedResources);
        await copyResourcesToClipboard(resources, command.useRelativePath);
      })
    );
  }

  for (const command of REGISTERED_SCM_FOLDER_COMMANDS) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command.id, async (
        resource: unknown,
        selectedResources: readonly unknown[] | undefined
      ) => {
        const folderUri = resolveFolderResourceUri(resource, selectedResources);
        const resources = folderUri ? [folderUri] : [];
        await copyResourcesToClipboard(resources, command.useRelativePath);
      })
    );
  }
}

export function deactivate(): void {
  // VS Code disposes command registrations through context subscriptions.
}

async function copyResourcesToClipboard(
  resources: readonly vscode.Uri[],
  useRelativePath: boolean
): Promise<void> {
  if (resources.length === 0) {
    void vscode.window.showInformationMessage("Copy Extra requires a file or folder selection.");
    return;
  }

  const content = await buildExplorerCopyContent(resources, useRelativePath);
  await vscode.env.clipboard.writeText(content);
  void vscode.window.setStatusBarMessage("Copy Extra copied to clipboard.", 2000);
}

function requiresSelection(mode: CopyMode): boolean {
  return mode === CopyMode.RelativePathLineRangeSelected
    || mode === CopyMode.RelativePathLineNumbersSelected
    || mode === CopyMode.FullPathLineRangeSelected
    || mode === CopyMode.FullPathLineRangeScopeSelected
    || mode === CopyMode.FullPathLineNumbersSelected;
}

function resolveExplorerResources(
  resource: unknown,
  selectedResources: readonly unknown[] | undefined
): readonly vscode.Uri[] {
  const resources = [
    ...collectResourceUris(selectedResources),
    ...collectResourceUris(resource)
  ];
  const seenResourceKeys = new Set<string>();
  const uniqueResources: vscode.Uri[] = [];

  for (const currentResource of resources) {
    const resourceKey = currentResource.toString();
    if (seenResourceKeys.has(resourceKey)) {
      continue;
    }

    seenResourceKeys.add(resourceKey);
    uniqueResources.push(currentResource);
  }

  return uniqueResources;
}

function collectResourceUris(value: unknown): vscode.Uri[] {
  if (Array.isArray(value)) {
    const uris: vscode.Uri[] = [];
    for (const item of value) {
      const uri = resolveResourceUri(item);
      if (uri) {
        uris.push(uri);
      }
    }
    return uris;
  }

  const uri = resolveResourceUri(value);
  return uri ? [uri] : [];
}

function resolveResourceUri(resource: unknown): vscode.Uri | undefined {
  if (resource instanceof vscode.Uri) {
    return resource;
  }

  if (!isRecord(resource)) {
    return undefined;
  }

  const resourceUri = resource.resourceUri;
  if (resourceUri instanceof vscode.Uri) {
    return resourceUri;
  }

  const uri = resource.uri;
  if (uri instanceof vscode.Uri) {
    return uri;
  }

  return undefined;
}

function resolveFolderResourceUri(
  resource: unknown,
  selectedResources: readonly unknown[] | undefined
): vscode.Uri | undefined {
  const folderUris: vscode.Uri[] = [];
  const fileUris: vscode.Uri[] = [];

  const collectFolderInputs = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) {
        collectFolderInputs(item);
      }
      return;
    }

    if (isRecord(value) && Array.isArray(value.resourceStates)) {
      const folderUri = resolveResourceUri(value);
      if (folderUri) {
        folderUris.push(folderUri);
        return;
      }
      for (const state of value.resourceStates) {
        const stateUri = resolveResourceUri(state);
        if (stateUri) {
          fileUris.push(stateUri);
        }
      }
      return;
    }

    const uri = resolveResourceUri(value);
    if (uri) {
      fileUris.push(uri);
    }
  };

  collectFolderInputs(resource);
  collectFolderInputs(selectedResources);

  if (folderUris.length > 0) {
    return folderUris[0];
  }

  return inferCommonParentDir(fileUris);
}

function inferCommonParentDir(uris: readonly vscode.Uri[]): vscode.Uri | undefined {
  if (uris.length === 0) {
    return undefined;
  }

  const dirSegments = uris.map((uri) => path.dirname(uri.fsPath).split(path.sep));
  const firstSegments = dirSegments[0];
  let commonLength = firstSegments.length;

  for (let index = 1; index < dirSegments.length; index++) {
    const currentSegments = dirSegments[index];
    const maxCompare = Math.min(commonLength, currentSegments.length);
    let matchLength = 0;
    while (matchLength < maxCompare && firstSegments[matchLength] === currentSegments[matchLength]) {
      matchLength++;
    }
    commonLength = matchLength;
    if (commonLength === 0) {
      return undefined;
    }
  }

  const commonPath = firstSegments.slice(0, commonLength).join(path.sep);
  return commonPath ? vscode.Uri.file(commonPath) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function buildExplorerCopyContent(
  resources: readonly vscode.Uri[],
  useRelativePath: boolean
): Promise<string> {
  const entries = await Promise.all(
    resources.map((selectedResource) => buildExplorerCopyEntry(selectedResource, useRelativePath))
  );
  return buildExplorerCopyContentFromEntries(entries, resolveCopyTextFormatOptions());
}

async function buildExplorerCopyEntry(resource: vscode.Uri, useRelativePath: boolean): Promise<ExplorerCopyEntry> {
  const prefix = await resolveExplorerResourcePrefix(resource);
  const displayPath = resolveResourceDisplayPath(resource, useRelativePath);
  return { prefix, displayPath };
}

async function resolveExplorerResourcePrefix(resource: vscode.Uri): Promise<ExplorerResourcePrefix> {
  try {
    const stat = await vscode.workspace.fs.stat(resource);
    return (stat.type & vscode.FileType.Directory) !== 0 ? "Path:" : "File:";
  } catch {
    return "File:";
  }
}
