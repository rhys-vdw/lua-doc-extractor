import { dropRightWhile, dropWhile } from "lodash";
import { logWarning } from "./log";
import { Attribute, Doc } from "./doc";
import { Token } from "moo";

export function stripGenericParams(text: string) {
  const index = text.indexOf("<");
  return index === -1 ? text : text.substring(0, index);
}

export function trimArray(array: readonly string[]): string[] {
  const isEmpty = (l: string) => l === "";
  return dropWhile(dropRightWhile(array, isEmpty), isEmpty);
}

export function trimFirstSpace(input: string): string {
  return input[0] === " " ? input.substring(1) : input;
}

function newLine(): Token {
  return { type: "space", text: "\n", value: "\n" } as any;
}

/**
 * Adds additional description lines, leaving a blank line between paragraphs.
 */
export function joinLines(dest: readonly Token[], src: readonly Token[]) {
  const s = trimStart(src);
  const d = trimEnd(dest);
  if (src.length === 0) {
    return d;
  }
  return [...d, newLine(), newLine(), ...s];
}

export function formatTokens(tokens: readonly Token[]): string {
  return tokens.map((t) => t.text).join("");
}

export function trimStart(tokens: readonly Token[]): Token[] {
  return dropWhile(tokens, (t) => t.text.trim() === "");
}

export function trimEnd(tokens: readonly Token[]): Token[] {
  return dropRightWhile(tokens, (t) => t.text.trim() === "");
}

export function formatAttribute({
  type,
  description,
}: Readonly<Attribute>): string {
  return `@${type}${formatTokens(description)}`;
}

/**
 * @returns An array containing first word, then the remaining text in
 * subsequent elements.
 */
export function splitFirstWord(attribute: Readonly<Attribute>): Token[] {
  const [firstWord, ...rest] = trimStart(attribute.description);
  if (firstWord == null) {
    logWarning(
      `Invalid attribute; Word expected: ${formatAttribute(attribute)}`
    );
    return [];
  }
  return [firstWord, ...rest];
}

export function isClass(comment: Doc) {
  return comment.attributes.findIndex((t) => t.type === "class") !== -1;
}

export function generateField(rule: Attribute, indent: string): string {
  const [fieldName, ...rest] = splitFirstWord(rule);
  if (fieldName == null) {
    logWarning(
      `Invalid attribute, field name expected: ${formatAttribute(rule)}`
    );
  }
  const description = formatTokens(rest).trim();
  if (description.length === 0) {
    logWarning(`Invalid attribute, Type expected: ${formatAttribute(rule)}`);
  }
  return (
    toLuaComment(`@type ${description}`, indent) +
    `\n${indent}${fieldName.value} = nil`
  );
}

export function toLuaComment(text: string, indent = ""): string {
  if (text === "") return "";
  return text.replace(/^/gm, `${indent}---`);
}

/**
 * Joins strings after trimming any trailing whitespace and discarding any empty
 * entries.
 */
export function joinNonEmpty(
  text: (string | null)[],
  separator: string
): string {
  return text
    .filter((t) => t != null)
    .map((t) => t.trimEnd())
    .filter((t) => t !== "")
    .join(separator);
}

export function trimTrailingWhitespace(input: string): string {
  return input.replace(/[^\S\n\r]+$/gm, "");
}
