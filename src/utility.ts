/**
 * Adds additional description lines, leaving a blank line between paragraphs.
 */
export function joinLines(dest: string, src: string) {
  if (src == null) {
    throw new Error(`src is ${src}`);
  }
  if (dest == null) {
    throw new Error(`dest is ${src}`);
  }

  const s = src.trimStart();
  const d = dest.trimEnd();
  if (d.length === 0) {
    return s;
  }
  if (s.length === 0) {
    return d;
  }
  return `${d}\n\n${s}`;
}

/***
 * Prefix each line of a string with `---` and an optional indent.
 */
export function toLuaComment(text: string, indent = ""): string {
  if (text === "") return "";
  return text.replace(/^/gm, `${indent}---`);
}

/**
 * Join strings after trimming any final whitespace and discarding any empty
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

/**
 * Remove trailing whitespace from each line in a string.
 */
export function trimTrailingWhitespace(input: string): string {
  return input.replace(/[^\S\n\r]+$/gm, "");
}
