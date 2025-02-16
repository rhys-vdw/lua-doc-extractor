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
  commentStart: string;
  commentStartChars: string;
  commentEnd: string;
  commentEndChars: string;
  commentMidChars: string;
}

const defaultOptions: Options = {
  commentStart: "/***",
  commentStartChars: "*",
  commentEnd: "*/",
  commentEndChars: "*",
  commentMidChars: "*",
};

export interface RawComment {
  lines: string[];
  start: Position;
  end: Position;
}

export function getRawComments(
  source: string,
  { commentStart, commentEnd }: Pick<Options, "commentStart" | "commentEnd">
): RawComment[] {
  const result = [] as RawComment[];
  const lines = source.split("\n");
  let current = null as Partial<RawComment> | null;

  lines.forEach((line, i) => {
    let j = 0;

    // Loop in case we have multiple comments on the same line.
    while (true) {
      // Check if a comment was opened on this line.
      if (current === null) {
        j = line.indexOf(commentStart, j);

        // If not, then abort.
        if (j === -1) {
          break;
        }

        // Otherwise, initialize the next comment.
        current = {
          lines: [],
          start: { lineNumber: i + 1, columnNumber: j + 1 },
        };
        j += commentStart.length;
      }

      if (current !== null) {
        // Check if the comment ends on this line.
        let endIndex = line.indexOf(commentEnd, j);

        // The comment doesn't end, so take the entire line.
        if (endIndex === -1) {
          current.lines!.push(line.substring(j));
          break;
        }

        // Otherwise take the line up until the end.
        current.lines!.push(line.substring(j, endIndex));
        current.end = {
          lineNumber: i + 1,
          columnNumber: endIndex + commentEnd.length,
        };
        result.push(current as RawComment);

        // Reset current.
        current = null;
        j = endIndex;
      }
    }
  });

  if (current !== null) {
    logWarning("Unclosed comment");
  }

  return result;
}

function parseComment(
  raw: RawComment,
  { commentStartChars, commentEndChars, commentMidChars }: Options
): Comment | null {
  if (raw.lines.length === 0) {
    logWarning("Comment had zero lines");
    return null;
  }
  const lastIndex = raw.lines.length - 1;
  raw.lines[0] = trimStart(raw.lines[0], commentStartChars);
  raw.lines[lastIndex] = trimEnd(raw.lines[lastIndex], commentEndChars);

  const lines = raw.lines;
  let description = [] as string[];
  let currentTag = null as Tag | null;
  const tags = [] as Tag[];
  lines.forEach((line) => {
    line = trimFirstSpace(trimStart(line.trim(), commentMidChars));

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
    .map((c) => parseComment(c, options))
    .filter((c) => c !== null);
}
