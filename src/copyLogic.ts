export enum CopyMode {
  FullPathLineNumbersSelected = "fullPathLineNumbersSelected",
  RelativePathLineNumbersSelected = "relativePathLineNumbersSelected",
  FullPathLineRangeSelected = "fullPathLineRangeSelected",
  RelativePathLineRangeSelected = "relativePathLineRangeSelected",
  FullPathAndLineRangeOnly = "fullPathAndLineRangeOnly",
  RelativePathAndLineRangeOnly = "relativePathAndLineRangeOnly",
  FullPathLineRange = "fullPathLineRange",
  RelativePathLineRange = "relativePathLineRange",
  FullPathLineNumbers = "fullPathLineNumbers",
  RelativePathLineNumbers = "relativePathLineNumbers"
}

export interface SelectionSnapshot {
  readonly selectedText: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly touchedLineText: string;
}

export type ExplorerResourcePrefix = "File:" | "Path:";

export interface ExplorerCopyEntry {
  readonly prefix: ExplorerResourcePrefix;
  readonly displayPath: string;
}

export function buildCopyContent(
  filePath: string,
  snapshot: SelectionSnapshot,
  mode: CopyMode
): string {
  const header = buildFileHeader(filePath, snapshot.startLine, snapshot.endLine);

  switch (mode) {
    case CopyMode.FullPathAndLineRangeOnly:
    case CopyMode.RelativePathAndLineRangeOnly:
      return header;
    case CopyMode.FullPathLineRangeSelected:
    case CopyMode.RelativePathLineRangeSelected:
      return `${header}${snapshot.selectedText}`;
    case CopyMode.FullPathLineNumbersSelected:
    case CopyMode.RelativePathLineNumbersSelected:
      return `${header}${formatSelectedTextWithLineNumbers(snapshot.selectedText, snapshot.startLine)}`;
    case CopyMode.FullPathLineNumbers:
    case CopyMode.RelativePathLineNumbers:
      return `${header}${formatSelectedTextWithLineNumbers(snapshot.touchedLineText, snapshot.startLine)}`;
    case CopyMode.FullPathLineRange:
    case CopyMode.RelativePathLineRange:
      return `${header}${snapshot.touchedLineText}`;
  }
}

export function resolveSelectedEndLine(
  documentText: string,
  selectionStartOffset: number,
  selectedText: string,
  lineCount: number
): number {
  const startLine = computeLineNumberAt(documentText, selectionStartOffset);
  if (selectedText.length === 0) {
    return startLine;
  }

  const textWithoutTrailingLineBreak = trimTrailingLineBreak(selectedText);
  if (textWithoutTrailingLineBreak.length === 0) {
    return startLine;
  }

  const selectedLineBreakCount = countLineBreaks(textWithoutTrailingLineBreak);
  return Math.min(lineCount - 1, startLine + selectedLineBreakCount);
}

export function trimTrailingLineBreak(text: string): string {
  let endIndex = text.length;
  while (endIndex > 0) {
    const currentChar = text.charAt(endIndex - 1);
    if (currentChar !== "\n" && currentChar !== "\r") {
      break;
    }
    endIndex--;
  }
  return text.slice(0, endIndex);
}

export function countLineBreaks(text: string): number {
  let lineBreakCount = 0;
  for (let i = 0; i < text.length; i++) {
    const currentChar = text.charAt(i);
    if (currentChar === "\n") {
      lineBreakCount++;
      continue;
    }
    if (currentChar === "\r") {
      lineBreakCount++;
      if (i + 1 < text.length && text.charAt(i + 1) === "\n") {
        i++;
      }
    }
  }
  return lineBreakCount;
}

export function formatSelectedTextWithLineNumbers(selectedText: string, startLine: number): string {
  if (selectedText.length === 0) {
    return "";
  }

  const normalizedText = selectedText.replace(/\r\n/g, "\n");
  const selectedLines = normalizedText.split("\n");
  if (selectedLines.length > 0 && selectedLines[selectedLines.length - 1] === "") {
    selectedLines.pop();
  }

  return selectedLines
    .map((line, index) => `${String(startLine + index + 1).padStart(5, " ")}: ${line}`)
    .join("\n")
    .concat(selectedLines.length > 0 ? "\n" : "");
}

export function buildFileHeader(filePath: string, startLine: number, endLine: number): string {
  const lineRange = startLine === endLine
    ? `${startLine + 1}`
    : `${startLine + 1}-${endLine + 1}`;
  return `File: ${filePath}:${lineRange} 行\n`;
}

export function buildExplorerCopyContentFromEntries(entries: readonly ExplorerCopyEntry[]): string {
  const groupedPaths = new Map<ExplorerResourcePrefix, string[]>();

  for (const entry of entries) {
    const paths = groupedPaths.get(entry.prefix);
    if (paths) {
      paths.push(entry.displayPath);
      continue;
    }

    groupedPaths.set(entry.prefix, [entry.displayPath]);
  }

  return Array.from(groupedPaths.entries())
    .map(([prefix, paths]) => `${prefix} ${paths.join(",")}`)
    .join("\n");
}

function computeLineNumberAt(text: string, offset: number): number {
  let line = 0;
  for (let i = 0; i < offset && i < text.length; i++) {
    const currentChar = text.charAt(i);
    if (currentChar === "\n") {
      line++;
      continue;
    }
    if (currentChar === "\r") {
      line++;
      if (i + 1 < offset && text.charAt(i + 1) === "\n") {
        i++;
      }
    }
  }
  return line;
}
