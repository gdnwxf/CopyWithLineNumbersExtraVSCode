# Copy Extra By QingHao for VS Code

VS Code extension that ports the editor copy behaviors from the IntelliJ plugin:

- Copy selected code with line numbers and full path
- Copy selected code with line numbers and relative path
- Copy only file path and selected line range
- Copy the touched full lines with `File: ...:start-end 行` header
- Default shortcut aligned with the original plugin: `Ctrl+Shift+C` / `Cmd+Shift+C`

## Commands

- `Copy Relative Path Line Range Only`
- `Copy Full Path and Line Range Only`
- `Copy Relative Path Line Range Selected`
- `Copy Relative Path Line Numbers Selected`
- `Copy Full Path Line Range Selected`
- `Copy Full Path Line Numbers Selected`
- `Copy Relative Path Line Range`
- `Copy Relative Path Line Numbers`
- `Copy Full Path Line Range`
- `Copy Full Path Line Numbers`

## Shortcut

- `Ctrl+Shift+C` on Windows/Linux
- `Cmd+Shift+C` on macOS

This shortcut runs `Copy Full Path Line Range Selected`.

## Development

```bash
npm install
npm run build
```

Press `F5` in VS Code to launch an Extension Development Host.
