import * as vscode from "vscode";
import { buildEditorCopyContent, CopyMode, resolveResourceDisplayPath } from "./copyFormatter";
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
  { id: "copyExtra.copyRelativePathAndLineRangeOnly", mode: CopyMode.RelativePathAndLineRangeOnly },
  { id: "copyExtra.copyFullPathAndLineRangeOnly", mode: CopyMode.FullPathAndLineRangeOnly },
  { id: "copyExtra.copyRelativePathLineRangeSelected", mode: CopyMode.RelativePathLineRangeSelected },
  { id: "copyExtra.copyRelativePathLineNumbersSelected", mode: CopyMode.RelativePathLineNumbersSelected },
  { id: "copyExtra.copyFullPathLineRangeSelected", mode: CopyMode.FullPathLineRangeSelected },
  { id: "copyExtra.copyFullPathLineNumbersSelected", mode: CopyMode.FullPathLineNumbersSelected },
  { id: "copyExtra.copyRelativePathLineRange", mode: CopyMode.RelativePathLineRange },
  { id: "copyExtra.copyRelativePathLineNumbers", mode: CopyMode.RelativePathLineNumbers },
  { id: "copyExtra.copyFullPathLineRange", mode: CopyMode.FullPathLineRange },
  { id: "copyExtra.copyFullPathLineNumbers", mode: CopyMode.FullPathLineNumbers }
] as const;

const REGISTERED_EXPLORER_COMMANDS: readonly RegisteredExplorerCommand[] = [
  { id: "copyExtra.copyExplorerRelativePath", useRelativePath: true },
  { id: "copyExtra.copyExplorerFullPath", useRelativePath: false }
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
        resource: vscode.Uri | undefined,
        selectedResources: readonly vscode.Uri[] | undefined
      ) => {
        const resources = resolveExplorerResources(resource, selectedResources);
        if (resources.length === 0) {
          void vscode.window.showInformationMessage("Copy Extra requires a file or folder selection.");
          return;
        }

        const content = await buildExplorerCopyContent(resources, command.useRelativePath);
        await vscode.env.clipboard.writeText(content);
        void vscode.window.setStatusBarMessage("Copy Extra copied to clipboard.", 2000);
      })
    );
  }
}

export function deactivate(): void {
  // VS Code disposes command registrations through context subscriptions.
}

function requiresSelection(mode: CopyMode): boolean {
  return mode === CopyMode.RelativePathLineRangeSelected
    || mode === CopyMode.RelativePathLineNumbersSelected
    || mode === CopyMode.FullPathLineRangeSelected
    || mode === CopyMode.FullPathLineNumbersSelected;
}

function resolveExplorerResources(
  resource: vscode.Uri | undefined,
  selectedResources: readonly vscode.Uri[] | undefined
): readonly vscode.Uri[] {
  const resources = selectedResources && selectedResources.length > 0
    ? selectedResources
    : resource ? [resource] : [];
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

async function buildExplorerCopyContent(
  resources: readonly vscode.Uri[],
  useRelativePath: boolean
): Promise<string> {
  const entries = await Promise.all(
    resources.map((selectedResource) => buildExplorerCopyEntry(selectedResource, useRelativePath))
  );
  return buildExplorerCopyContentFromEntries(entries);
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
