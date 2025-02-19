import moo, { Lexer, Rules } from "moo";

/** Lexes the comment body of Lua doc comments. */
export const docLexer = moo.states({
  main: {
    attribute: /@[^\s]+/,
    codeBlockStart: { match: /```[a-zA-Z]*/, push: "codeBlock" },
    inlineCodeStart: { match: /`/, push: "inlineCode" },
    newline: { match: "\n", lineBreaks: true },
    word: /[^\s]+?(?=\s|$|(?!\\)`)/,
    space: /[ \t]+/,
  },
  codeBlock: {
    // TODO: Support escaping backticks.
    code: { match: /[^]+?(?=```)/, lineBreaks: true },
    codeBlockEnd: { match: "```", pop: 1 },
  },
  inlineCode: {
    // TODO: Support escaping backticks.
    code: { match: /[^]+?(?=`)/, lineBreaks: true },
    inlineCodeEnd: { match: "`", pop: 1 },
  },
});

// const c = `
// \`\`\`lua
// Here is
//   some code! \`
// blah
// \`\`\`
// Changes the value
// \`@function Spring.SetAlly\`
// @param firstAllyTeamID integer
// `;

// function detail(lexer: Lexer, s: string) {
//   const result = [];
//   lexer.reset(s);
//   for (const entry of lexer) {
//     const t = `'${entry.text.replace("\t", "\\t")}'`;
//     result.push(
//       `${entry.type} -> ${t.padStart(15 + t.length - entry.type!.length)}`
//     );
//     // console.log(entry);
//   }
//   console.log(result.join("\n"));
// }

// detail(docLexer, c);
// // detail(commentLexer, c);
// // const comments = getRawComments(c);
// // console.log(comments.length);
// // for (let { start, end, text } of comments) {
// //   console.log(
// //     `-------- ${start.lineNumber}:${start.columnNumber}-${end.lineNumber}:${end.columnNumber}`
// //   );
// //   console.log(`${text}`);
// //   // console.log(`--------- Detail`);
// //   detail(docLexer, text);
// //   // console.log(`--------- End detail`);
// // }
