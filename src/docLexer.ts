import moo from "moo";

/** Lexes the comment body of Lua doc comments. */
export const docLexer = moo.states({
  main: {
    attribute: { match: /@[^\s]+/, value: (x) => x.substring(1) },
    codeBlockStart: { match: /```[a-zA-Z]*\s*\n/, push: "codeBlock" },
    // Handle double escaped backticks.
    // TODO: This should support arbitrary numbers of backticks, not sure how.
    //       Or perhaps just don't care about inline code at all here and handle
    //       it in the parser.
    inlineCode2Start: {
      match: /``/,
      push: "inlineCode2",
      type: () => "inlineCodeStart",
    },
    inlineCodeStart: { match: /`/, push: "inlineCode" },
    newline: { match: "\n", lineBreaks: true },
    word: /\S+?(?=\s|$|(?!\\)`)/,
    // Matches all whitespace except linefeeds.
    // https://stackoverflow.com/a/3469155/317135
    space: /[^\S\r\n]+/,
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
  inlineCode2: {
    inlineCodeEnd: { match: "``", pop: 1 },
    // TODO: Support escaping backticks.
    code: { match: /[^]+?(?=``)/, lineBreaks: true },
  },
});
