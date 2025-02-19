import nearley from "nearley";
import grammar from "./grammar.ne";
import { Comment } from "./comment";

import { Token } from "moo";
import { Position } from "./source";
import { formatAttribute, formatTokens } from "./utility";

export interface Doc {
  description: Token[];
  attributes: Attribute[];
  start: Position;
  end: Position;
}

export interface Attribute {
  type: string;
  description: Token[];
}

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
const initialState = parser.save();

export function parseDoc(comment: Comment): Doc {
  parser.restore(initialState);
  const { text, start, end } = comment;
  parser.feed(text);
  if (parser.results.length > 1) {
    console.error(
      `Ambiguous parse for comment (result  count: ${parser.results.length}):\n-----\n${text}\n----\n`
    );
    // parser.results.forEach((r, i) => {
    //   console.log(`\n-----\nPARSE ${i}\n----`);
    //   console.log(require("util").inspect(r, { depth: Infinity }));
    //   console.log(`\n-----\nEND PARSE ${i}\n----`);
    // });
  }
  if (parser.results.length === 0) {
    throw new Error(`Error parsing comment.`);
  }
  return {
    ...parser.results[0],
    start,
    end,
  };
}

export function formatDoc({ description, attributes }: Doc): string {
  return [formatTokens(description), ...attributes.map(formatAttribute)].join(
    "\n"
  );
}
