import { trimStart, trimEnd, dropWhile, dropRightWhile } from "lodash";

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
  commentStart: "/**",
  commentStartChars: "*",
  commentEnd: "*/",
  commentEndChars: "*",
  commentMidChars: "*",
};

function getComments(
  source: string,
  { commentStart, commentEnd }: Options
): string[] {
  const result = [] as string[];
  let index = 0;
  while (true) {
    index = source.indexOf(commentStart, index);
    if (index === -1) {
      break;
    }
    index += commentStart.length;
    let endIndex = source.indexOf(commentEnd, index);
    if (endIndex === -1) {
      break;
    }
    result.push(source.substring(index, endIndex));
    index = endIndex + commentEnd.length;
  }
  return result;
}

function trimArray(array: string[]): string[] {
  const isEmpty = (l: string) => l === "";
  return dropWhile(dropRightWhile(array, isEmpty), isEmpty);
}

function parseComment(
  comment: string,
  { commentStartChars, commentEndChars, commentMidChars }: Options
): Comment | null {
  comment = trimStart(comment, commentStartChars);
  comment = trimEnd(comment, commentEndChars);
  comment.trim();

  const lines = comment.split("\n");
  let description = [] as string[];
  let currentTag = null as Tag | null;
  const tags = [] as Tag[];
  lines.forEach((line) => {
    line = trimStart(line.trim(), commentMidChars).trimStart();

    if (line.startsWith("@")) {
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
  return getComments(source, options)
    .map((c) => parseComment(c, options))
    .filter((c) => c !== null);
}
