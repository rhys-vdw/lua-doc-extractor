import moo from "moo";

/** Lexes the comment body of Lua doc comments. */
export const docLexer = moo.states({
  main: {
    attribute: { match: /@[^\s]+/, value: (x) => x.substring(1) },
    codeBlockStart: { match: /```[a-zA-Z]*/, push: "codeBlock" },
    inlineCodeStart: { match: /`/, push: "inlineCode" },
    newline: { match: "\n", lineBreaks: true },
    word: /[^\s]+?(?=\s|$|(?!\\)`)/,
    space: /[ \t]+/,
  },
  codeBlock: {
    codeBlockEnd: { match: "```", pop: 1 },
    // TODO: Support escaping backticks.
    code: { match: /[^]+?(?=```)/, lineBreaks: true },
  },
  inlineCode: {
    inlineCodeEnd: { match: "`", pop: 1 },
    // TODO: Support escaping backticks.
    code: { match: /[^]+?(?=`)/, lineBreaks: true },
  },
});
