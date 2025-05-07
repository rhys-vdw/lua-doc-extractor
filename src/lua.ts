const keywords = [
  "and",
  "break",
  "do",
  "else",
  "elseif",
  "end",
  "false",
  "for",
  "function",
  "if",
  "in",
  "local",
  "nil",
  "not",
  "or",
  "repeat",
  "return",
  "then",
  "true",
  "until",
  "while",
];

export function isKeyword(word: string): boolean {
  return keywords.includes(word);
}

export const nil = "nil";

export function formatTypeName(name: readonly string[]): string {
  return name.join(".");
}

export function formatMethodName(name: readonly string[]): string {
  if (name.length === 0) {
    return "";
  }
  if (name.length === 1) {
    return name[0];
  }
  const tables = name.slice(0, -1);
  const last = name.at(-1)!;
  return formatFieldPath(tables) + ":" + last;
}

export function formatFieldPath(name: readonly string[]): string {
  if (name.length === 0) {
    return "";
  }

  const [first, ...rest] = name;

  return [
    isKeyword(first) ? `["${first}"]` : first,
    ...rest.map((n) => (isKeyword(n) ? `["${n}"]` : `.${n}`)),
  ].join("");
}
