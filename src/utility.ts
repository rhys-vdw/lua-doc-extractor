import { dropRightWhile, dropWhile } from "lodash";
import { logWarning } from "./log";
import { Comment, Tag } from "./parser";

export function stripGenericParams(text: string) {
  const index = text.indexOf("<");
  return index === -1 ? text : text.substring(0, index);
}

export function trimArray(array: readonly string[]): string[] {
  const isEmpty = (l: string) => l === "";
  return dropWhile(dropRightWhile(array, isEmpty), isEmpty);
}

/**
 * Adds additional description lines, leaving a blank line between paragraphs.
 */
export function appendLines(dest: string[], src: readonly string[]) {
  if (src.length > 0) {
    dest.push("", ...src);
  }
}

/**
 * @returns string[] An array containing first word, then the remaining text in
 * subsequent elements.
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
    return [firstWord, ...trimArray(rest)];
  }
  return [firstWord, firstLineRemainder, ...rest];
}

export function isClass(comment: Comment) {
  return comment.tags.findIndex((t) => t.type === "class") !== -1;
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
