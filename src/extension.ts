import * as vscode from "vscode";
import { buildEditorCopyContent, CopyMode } from "./copyFormatter";

interface RegisteredCommand {
  readonly id: string;
  readonly mode: CopyMode;
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

export function activate(context: vscode.ExtensionContext): void {
  for (const command of REGISTERED_COMMANDS) {
    context.subscriptions.push(
      vscode.commands.registerTextEditorCommand(command.id, async (editor) => {
        const selection = editor.selection;
        if (selection.isEmpty) {
          void vscode.window.showInformationMessage("Copy Extra requires a non-empty selection.");
          return;
        }

        const content = buildEditorCopyContent(editor.document, selection, command.mode);
        await vscode.env.clipboard.writeText(content);
        void vscode.window.setStatusBarMessage("Copy Extra copied to clipboard.", 2000);
      })
    );
  }
}

export function deactivate(): void {
  // VS Code disposes command registrations through context subscriptions.
}
