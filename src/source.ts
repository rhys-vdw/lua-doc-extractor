import { join } from "path";

export interface Position {
  line: number;
  col: number;
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
  const url = URL.parse(repoUrl);
  if (url == null) {
    return "";
  }
  url.pathname = join(url.pathname, path);
  return `${url}#L${start.line}-L${end.line}`;
}
