import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCopyContent,
  buildFileHeader,
  CopyMode,
  countLineBreaks,
  formatSelectedTextWithLineNumbers,
  resolveSelectedEndLine,
  trimTrailingLineBreak
} from "./copyLogic";

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
