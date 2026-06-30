import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCopyContent,
  buildExplorerCopyContentFromEntries,
  buildFileHeader,
  CopyMode,
  countLineBreaks,
  formatSelectedTextWithLineNumbers,
  resolveSelectedEndLine,
  trimTrailingLineBreak
} from "./copyLogic";
import { formatFullPath, formatRelativePath } from "./pathFormatter";

test("trimTrailingLineBreak removes trailing CRLF and LF", () => {
  assert.equal(trimTrailingLineBreak("abc\r\n"), "abc");
  assert.equal(trimTrailingLineBreak("abc\n\n"), "abc");
});

test("countLineBreaks counts mixed line endings", () => {
  assert.equal(countLineBreaks("a\nb\r\nc\rd"), 3);
});

test("resolveSelectedEndLine ignores trailing newline from full-line selection", () => {
  const documentText = "line1\nline2\nline3\n";
  const startOffset = documentText.indexOf("line2");
  assert.equal(resolveSelectedEndLine(documentText, startOffset, "line2\n", 3), 1);
});

test("formatSelectedTextWithLineNumbers prefixes each selected line", () => {
  assert.equal(
    formatSelectedTextWithLineNumbers("foo\nbar", 9),
    "   10: foo\n   11: bar\n"
  );
});

test("buildFileHeader formats single-line and multi-line ranges", () => {
  assert.equal(buildFileHeader("/tmp/a.ts", 4, 4), "File: /tmp/a.ts:5 行\n");
  assert.equal(buildFileHeader("/tmp/a.ts", 4, 6), "File: /tmp/a.ts:5-7 行\n");
});

test("buildFileHeader supports empty prefix and suffix", () => {
  assert.equal(
    buildFileHeader("/tmp/a.ts", 4, 6, { filePrefix: "", fileSuffix: "", pathPrefix: "Path:" }),
    "/tmp/a.ts:5-7\n"
  );
});

test("buildCopyContent prefixes header and line numbers for selected text", () => {
  assert.equal(
    buildCopyContent(
      "src/a.ts",
      {
        selectedText: "foo\nbar",
        startLine: 1,
        endLine: 2,
        touchedLineText: "foo\nbar"
      },
      CopyMode.RelativePathLineNumbersSelected
    ),
    "File: src/a.ts:2-3 行\n    2: foo\n    3: bar\n"
  );
});

test("buildCopyContent prefixes header and line numbers for touched full lines", () => {
  assert.equal(
    buildCopyContent(
      "src/a.ts",
      {
        selectedText: "oo\nba",
        startLine: 1,
        endLine: 2,
        touchedLineText: "foo\nbar"
      },
      CopyMode.FullPathLineNumbers
    ),
    "File: src/a.ts:2-3 行\n    2: foo\n    3: bar\n"
  );
});

test("buildExplorerCopyContentFromEntries joins selected folders on one line", () => {
  assert.equal(
    buildExplorerCopyContentFromEntries([
      { prefix: "Path:", displayPath: "dist" },
      { prefix: "Path:", displayPath: "node_modules" },
      { prefix: "Path:", displayPath: "src" }
    ]),
    "Path: dist,node_modules,src"
  );
});

test("buildExplorerCopyContentFromEntries joins selected files on one line", () => {
  assert.equal(
    buildExplorerCopyContentFromEntries([
      { prefix: "File:", displayPath: "package.json" },
      { prefix: "File:", displayPath: "tsconfig.json" }
    ]),
    "File: package.json,tsconfig.json"
  );
});

test("buildExplorerCopyContentFromEntries supports empty file and path prefixes", () => {
  assert.equal(
    buildExplorerCopyContentFromEntries([
      { prefix: "Path:", displayPath: "src" },
      { prefix: "File:", displayPath: "package.json" }
    ], { filePrefix: "", fileSuffix: "行", pathPrefix: "" }),
    "src\npackage.json"
  );
});

test("buildExplorerCopyContentFromEntries groups mixed resource types", () => {
  assert.equal(
    buildExplorerCopyContentFromEntries([
      { prefix: "Path:", displayPath: "src" },
      { prefix: "File:", displayPath: "package.json" },
      { prefix: "Path:", displayPath: "dist" }
    ]),
    "Path: src,dist\nFile: package.json"
  );
});

test("formatFullPath converts Windows drive paths by selected shell format", () => {
  const windowsPath = "c:\\a\\main.cpp";
  assert.equal(formatFullPath(windowsPath, "default", "win32"), "c:\\a\\main.cpp");
  assert.equal(formatFullPath(windowsPath, "wsl", "win32"), "/mnt/c/a/main.cpp");
  assert.equal(formatFullPath(windowsPath, "unix", "win32"), "C:/a/main.cpp");
  assert.equal(formatFullPath(windowsPath, "cygwin", "win32"), "/cygdrive/c/a/main.cpp");
  assert.equal(formatFullPath(windowsPath, "msys", "win32"), "/c/a/main.cpp");
  assert.equal(formatFullPath(windowsPath, "gitBash", "win32"), "/c/a/main.cpp");
});

test("formatRelativePath follows selected Windows shell separator", () => {
  assert.equal(formatRelativePath("src\\main.cpp", "default", "win32"), "src\\main.cpp");
  assert.equal(formatRelativePath("src\\main.cpp", "wsl", "win32"), "src/main.cpp");
  assert.equal(formatRelativePath("src\\main.cpp", "gitBash", "win32"), "src/main.cpp");
});

test("path formatting leaves non-Windows paths unchanged", () => {
  assert.equal(formatFullPath("/Users/liam/a/main.cpp", "wsl", "darwin"), "/Users/liam/a/main.cpp");
  assert.equal(formatRelativePath("src/main.cpp", "wsl", "linux"), "src/main.cpp");
});
