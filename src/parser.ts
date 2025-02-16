import { trimStart, trimEnd } from "lodash";
import { trimArray, trimFirstSpace } from "./utility";
import { logWarning } from "./log";

export interface Comment {
  description: string[];
  tags: Tag[];
}

export interface Tag {
  type: string;
  detail: string[];
}

export interface Position {
  lineNumber: number;
  columnNumber: number;
}

export interface Options {
  commentStart: RegExp;
  commentLine: RegExp;
  commentEnd: RegExp;
}

// TODO: Use a real parser, this is silly.
// https://github.com/rhys-vdw/lua-doc-extractor/issues/20
export const defaultOptions: Options = {
  commentStart: /(\/\*{3})/g,
  commentLine: /(^\s+\*)([^/]|$)/g,
  commentEnd: /(\*\/)/g,
};

export interface RawComment {
  lines: string[];
  start: Position;
  end: Position;
}

function trimLine(line: string) {
  // Remove trailing whitespace.
  line = line.trimEnd();

  // If the line is entirely asterisks, return empty string.
  if (/^\**$/.test(line)) {
    return "";
  }

  // Remove the first space in the line.
  return trimFirstSpace(line);
}

export function getRawComments(
  source: string,
  { commentStart, commentLine, commentEnd }: Options
): RawComment[] {
  const result = [] as RawComment[];
  const lines = source.split("\n");
  let current = null as Partial<RawComment> | null;

  lines.forEach((line, l) => {
    let c = 0;

    // Loop in case we have multiple comments on the same line.
    while (true) {
      if (current === null) {
        // Check if a comment was opened on this line.
        commentStart.lastIndex = c;
        const start = commentStart.exec(line);

        // If not, then abort.
        if (start === null) {
          break;
        }

        c = start.index;

        // Initialize the next comment.
        current = {
          lines: [],
          start: { lineNumber: l + 1, columnNumber: c + 1 },
        };
        c += start[1].length;
      } else {
        // Trim out the the start of the line.
        commentLine.lastIndex = c;
        const mid = commentLine.exec(line);
        if (mid !== null) {
          c = mid.index + mid[1].length;
        }
      }

      if (current !== null) {
        // Check if the comment ends on this line.
        commentEnd.lastIndex = c;
        const end = commentEnd.exec(line);

        // The comment doesn't end, so take the entire line.
        if (end === null) {
          current.lines!.push(trimLine(line.substring(c)));
          break;
        }

        // Otherwise take the line up until the end.
        current.lines!.push(trimLine(line.substring(c, end.index)));
        c = end.index + end[1].length;
        current.end = {
          lineNumber: l + 1,
          columnNumber: c,
        };
        result.push(current as RawComment);

        // Reset current.
        current = null;
      }
    }
  });

  if (current !== null) {
    logWarning("Unclosed comment");
  }

  return result;
}

function parseComment(raw: RawComment): Comment | null {
  if (raw.lines.length === 0) {
    logWarning("Comment had zero lines");
    return null;
  }

  const lines = raw.lines;
  let description = [] as string[];
  let currentTag = null as Tag | null;
  const tags = [] as Tag[];
  lines.forEach((line) => {
    if (line.trimStart().startsWith("@")) {
      if (currentTag !== null) {
        tags.push(currentTag);
      }
      const matches = /@(\w+)(:?\s+(.*))?/.exec(line);
      if (matches === null) {
        console.error(`Invalid tag: ${line}`);
        return;
      }
      const [, type, detail] = matches;
      line.slice(1).search(/\s/);
      currentTag = {
        type,
        detail: detail == null ? [] : [detail.trim()],
      };
      return;
    }

    if (currentTag === null) {
      description.push(line);
    } else {
      currentTag.detail.push(line);
    }
  });

  if (currentTag !== null) {
    tags.push(currentTag);
  }

  description = trimArray(description);
  tags.forEach((t) => (t.detail = trimArray(t.detail)));

  return description.length === 0 && tags.length === 0
    ? null
    : { description, tags };
}

export function parse(source: string, options = defaultOptions): Comment[] {
  return getRawComments(source, options)
    .map((c) => parseComment(c))
    .filter((c) => c !== null);
}
