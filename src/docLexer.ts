import moo, { keywords } from "moo";

/** Lexes the comment body of Lua doc comments. */
export const docLexer = moo.states({
  main: {
    attribute: {
      type: keywords({
        classAttr: "@class",
        enumAttr: "@enum",
        fieldAttr: "@field",
        globalAttr: "@global",
        tableAttr: "@table",
        functionAttr: "@function",
        paramAttr: "@param",
      }),
      match: /@[^\s]+/,
      value: (x) => x.substring(1),
    },
    pipe: "|",
    syntax: [..."()[]{}<>:?."],
    newline: { match: /\r?\n/, lineBreaks: true },
    // Matches all whitespace except linefeeds.
    // https://stackoverflow.com/a/3469155/317135
    literal: /[0-9]+|"[^"]*?"]/,
    space: /[^\S\r\n]+/,
    identifier: /[a-zA-Z_][a-zA-Z0-9_]*/,
    word: moo.fallback,
  },
});
