import { logWarning } from "./log";
import { Comment, Tag } from "./parser";

/**
 * Get the first word from detail array, and return the rest.
 */
export function splitFirstWord(tag: Tag): string[] {
  const [firstLine, ...rest] = tag.detail;
  const firstWord = firstLine.split(/\s/, 1)[0];
  if (firstWord == null) {
    logWarning(`Invalid tag; Word expected: ${formatTag(tag)}`);
    return [];
  }
  const firstLineRemainder = firstLine.substring(firstWord.length).trimStart();
  if (firstLineRemainder === "") {
    return [firstWord, ...rest];
  }
  return [firstWord, firstLineRemainder, ...rest];
}

export function isClass(comment: Comment) {
  return comment.tags.findIndex((t) => t.type === "class") !== -1;
}

/**
 * Get the first word from detail array, and warn if there was extra
 * data.
 */
export function ensureFirstWord(tag: Tag): string | null {
  const lines = splitFirstWord(tag);
  if (lines.length === 0) {
    return null;
  }
  const [firstWord, ...rest] = lines;
  if (rest.length > 0) {
    logWarning(`Invalid tag; Extra text ignored: ${formatTag(tag)}`);
  }
  return firstWord;
}

export function generateField(rule: Tag) {
  const [fieldName, ...detail] = splitFirstWord(rule);
  if (detail.length === 0) {
    logWarning(`Invalid tag; Type expected: ${formatTag(rule)}`);
  }
  const [typeLine, ...rest] = detail;
  return (
    toLuaComment([`@type ${typeLine}`, ...rest], "\t") +
    `\n\t${fieldName} = nil`
  );
}

export function toLuaComment(lines: string[], indent = ""): string | null {
  if (lines.length === 0) {
    return null;
  }
  return lines.map((line) => `${indent}---${line}`).join("\n");
}

export function formatTag({ type, detail }: Tag): string {
  let result = `@${type}`;
  if (detail.length > 0) {
    result += ` ${detail.join("\n")}`;
  }
  return result;
}
