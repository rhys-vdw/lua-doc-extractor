import moo, { Rules } from "moo";
import { Position } from "./source";
import dedent from "dedent-js";
import { Result, toResult } from "./result";

export interface Comment {
  start: Position;
  end: Position;
  text: string;
}

function makeState(rules: Readonly<Rules>): Rules {
  return {
    ...rules,
    newline: { match: "\n", lineBreaks: true },
    word: /[^\s]+/,
    // Matches all whitespace except linefeeds.
    // https://stackoverflow.com/a/3469155/317135
    space: /[^\S\r\n]+/,
  };
}

/** Extracts C-style block comments from input. */
const commentLexer = moo.states({
  code: makeState({
    blockCommentStart: { match: /\/\*{3,}(?!\/)/, push: "blockComment" },
    lineCommentStart: { match: /^\s*\/{3}/, push: "lineComment" },
  }),
  blockComment: makeState({
    indent: /^\s+\*(?!\/)/,
    blockCommentEnd: { match: /\*+\//, pop: 1 },
  }),
  lineComment: makeState({
    indent: /^\s*\/{3}/,
    lineCommentEnd: { match: /\n\s*(?!\/{3})/, lineBreaks: true, pop: 1 },
  }),
});

function trimParagraph(s: string): string {
  return s.replace(/\s+$/, "").trimStart();
}

export function getComments(s: string): Result<Comment[]> {
  return toResult(() => getCommentsUnsafe(s));
}

function getCommentsUnsafe(s: string): Comment[] {
  const result = [] as Comment[];
  let current = null as { text: string[]; start: Position } | null;

  commentLexer.reset(s);
  for (const entry of commentLexer) {
    // Check for end of comment.
    if (entry.type === "blockCommentEnd" || entry.type === "lineCommentEnd") {
      if (current === null) {
        console.error(
          `Encountered '${entry.type}' when not in a comment block: ${entry.line}:${entry.col}`
        );
      } else {
        const text = current.text.join("");
        // NOTE: Add an extra empty line at the front, because dedent will not
        // de-indent the first line. It strips all leading newlines.
        const dedented = dedent("\n" + text);
        result.push({
          text: trimParagraph(dedented),
          start: current.start,
          end: {
            line: entry.line,
            col: entry.col + entry.text.length - 1,
          },
        });
        current = null;
      }
    }

    // Accumulate comment body.
    if (current !== null && entry.type !== "indent") {
      current.text.push(entry.text);
    }

    // Start a new comment.
    if (
      entry.type === "blockCommentStart" ||
      entry.type === "lineCommentStart"
    ) {
      if (current !== null) {
        console.error(
          `Encountered "${entry.text}" when in a comment block: ${entry.line}:${entry.col}`
        );
      } else {
        current = {
          text: [],
          start: { line: entry.line, col: entry.col },
        };
      }
    }
  }

  if (current !== null) {
    console.error(`Incomplete comment`);
  }

  return result;
}
