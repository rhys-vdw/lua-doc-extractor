import dedent from "dedent-js";
import moo from "moo";
import { Result, toResult } from "./result";
import { Position } from "./source";
import { trimTrailingWhitespace } from "./utility";

export interface Comment {
  start: Position;
  end: Position;
  text: string;
}

/** Extracts C-style block comments from input. */
const commentLexer = moo.states({
  code: {
    commentStart: { match: /\/\*{3,}(?!\/)/, push: "comment" },
    text: moo.fallback,
  },
  comment: {
    indent: /^\s+\*(?!\/)/,
    commentEnd: { match: /\*+\//, pop: 1 },
    text: moo.fallback,
  },
});

export function getComments(s: string): Result<Comment[]> {
  return toResult(() => getCommentsUnsafe(s));
}

function getCommentsUnsafe(s: string): Comment[] {
  const result = [] as Comment[];
  let current = null as { text: string[]; start: Position } | null;

  commentLexer.reset(s);
  for (const entry of commentLexer) {
    // Check for end of comment.
    if (entry.type === "commentEnd") {
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
          // NOTE: Trimming trailing whitespace here because it makes the
          // grammer easier to write. Ideally the gammar would be whitespace
          // insensitive.
          //
          // See https://github.com/rhys-vdw/lua-doc-extractor/issues/60
          text: trimTrailingWhitespace(dedented.trimStart()),
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
    if (entry.type === "commentStart") {
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
