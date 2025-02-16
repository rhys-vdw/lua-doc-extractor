import { Tag } from "./tag";

export interface Position {
  lineNumber: number;
  columnNumber: number;
}

export interface Source {
  path: string;
  start: Position;
  end: Position;
}

export function formatSource(repoUrl: string, source: Source) {
  return `\[<a href="${sourceToUrl(
    repoUrl,
    source
  )}" target="_blank">source</a>\]`;
}

export function sourceToUrl(
  repoUrl: string,
  { path, start, end }: Source
): string {
  return `${repoUrl}${path}#L${start.lineNumber}-L${end.lineNumber}`;
}
