import { dropRightWhile, dropWhile } from "lodash";
import { logWarning } from "./log";
import { Attribute, Doc, FieldAttribute } from "./doc";
import { Token } from "moo";
import { isKeyword } from "./lua";

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

/**
 * Adds additional description lines, leaving a blank line between paragraphs.
 */
export function joinLines(dest: string, src: string) {
  const s = src.trimStart();
  const d = dest.trimEnd();
  if (src.length === 0) {
    return d;
  }
  return `${d}\n\n${s}`;
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
  return `@${type}${description}`;
}

/**
 * @returns An array containing first word, then the remaining text in
 * subsequent elements.
 */
export function splitFirstWord(
  attribute: Readonly<Attribute>
): [string, string?] | null {
  // https://stackoverflow.com/a/4607799/317135
  const [firstWord, rest] = attribute.description.trimStart().split(/\s+(.*)/s);
  if (firstWord == null) {
    logWarning(
      `Invalid attribute; Word expected: ${formatAttribute(attribute)}`
    );
    return null;
  }
  return [firstWord, rest];
}

export function generateField(rule: FieldAttribute, indent: string): string {
  if (rule.field == null) {
    logWarning(
      `Invalid attribute, field name expected: ${formatAttribute(rule)}`
    );
  }
  if (rule.field == null) {
    console.error(`No field property`, rule);
    return "";
  }
  var { name, type } = rule.field;
  return formatField(name, type, rule.description.trimStart(), indent);
}

export function formatField(
  name: string,
  type: string,
  description: string,
  indent: string
) {
  const fieldName = isKeyword(name) ? `["${name}"]` : name;
  return (
    toLuaComment(`@type ${type} ${description.trimEnd()}`, indent) +
    `\n${indent}${fieldName} = nil`
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
