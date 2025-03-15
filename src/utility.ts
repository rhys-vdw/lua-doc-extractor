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
