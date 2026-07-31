# Copy Extra By QingHao for VS Code

VS Code extension that ports the editor copy behaviors from the IntelliJ plugin:

- Copy selected code with line numbers and full path
- Copy selected code with line numbers and relative path
- Copy only file path and selected line range
- Copy selected code with an expanded full-path line range header
- Copy the touched full lines with `File: ...:start-end 行` header
- Copy full paths or relative paths for selected files and folders in file lists
- Default shortcut aligned with the original plugin: `Ctrl+Shift+C` / `Cmd+Shift+C`

## Menu

In the editor context menu, the commands are grouped under a top-level submenu:

- `Copy Extra`

In file list context menus, selected files and folders are also grouped under `Copy Extra`.

## Commands

- `Copy Full Path and Line Range Only`
- `Copy Relative Path Line Range Only`
- `Copy Full Path Line Range Scope Selected`
- `Copy Full Path Line Range Selected`
- `Copy Full Path Line Numbers Selected`
- `Copy Relative Path Line Range Selected`
- `Copy Relative Path Line Numbers Selected`
- `Copy Full Path Line Range`
- `Copy Full Path Line Numbers`
- `Copy Relative Path Line Range`
- `Copy Relative Path Line Numbers`
- `Copy Full Path`
- `Copy Relative Path`

`Copy Full Path Line Range Scope Selected` copies the selected code text only, while the header line range expands around the selection. The before/after line counts are configurable and default to 5 lines before and 5 lines after the selection.

File-list `Copy Full Path` and `Copy Relative Path` support both files and folders. Folder paths use the configured `Path:` prefix, and file paths use the configured `File:` prefix.

## Settings

Configure under VS Code `Settings`:

- `copyExtra.windowsCopyPathFormat`: Windows-only full path output format. macOS, Linux, and Unix use the default VS Code path format.
- `copyExtra.pathPrefix`: Prefix used for copied folders in file lists. Default: `Path:`.
- `copyExtra.filePrefix`: Prefix used before copied file paths. Default: `File:`.
- `copyExtra.fileSuffix`: Suffix used after editor line ranges. Default: `行`.
- `copyExtra.scopeSelectedBeforeLineCount`: Number of lines before the selection included in the `Copy Full Path Line Range Scope Selected` header. Default: `5`.
- `copyExtra.scopeSelectedAfterLineCount`: Number of lines after the selection included in the `Copy Full Path Line Range Scope Selected` header. Default: `5`.

## Shortcut

- `Ctrl+Shift+C` on Windows/Linux
- `Cmd+Shift+C` on macOS

This shortcut runs `Copy Full Path Line Range Scope Selected`.

## Install

Install the packaged extension from:

- `copy-extra-by-qinghao-plus-0.0.17.vsix`

In VS Code:

1. Open Extensions
2. Click `...`
3. Select `Install from VSIX...`
4. Choose the `.vsix` file
5. Reload VS Code

Command line:

```bash
code --install-extension /mnt/d/abc/CopyWithLineNumbersExtraVSCode/copy-extra-by-qinghao-plus-0.0.17.vsix
```

## Development

```bash
npm install
npm run build
```

Press `F5` in VS Code to launch an Extension Development Host.
