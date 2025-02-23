import nearley from "nearley";
import grammar from "./grammar.ne";
import { Comment } from "./comment";

import { Token } from "moo";
import { Position } from "./source";
import {
  formatAttribute,
  formatTokens,
  joinNonEmpty,
  toLuaComment,
  trimStart,
} from "./utility";
import { Result, toResult } from "./result";

export interface Doc {
  description: Token[];
  attributes: Attribute[];
  path?: string;
  start: Position;
  end: Position;
  lua: string[];
}

export interface Attribute {
  type: string;
  description: Token[];
}

function parse(comment: Comment): Doc {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  const { text, start, end } = comment;
  parser.feed(text);
  if (parser.results.length > 1) {
    // console.error(
    //   `Ambiguous parse for comment (result  count: ${parser.results.length}):\n-----\n${text}\n----\n`
    // );
    // parser.results.forEach((r, i) => {
    //   console.log(`\n-----\nPARSE ${i}\n----`);
    //   console.log(require("util").inspect(r, { depth: Infinity }));
    //   console.log(`\n-----\nEND PARSE ${i}\n----`);
    // });
  }
  if (parser.results.length === 0) {
    throw new Error(`No parser output.`);
  }
  return {
    ...parser.results[0],
    start,
    end,
  };
}

export function parseDoc(comment: Comment): Result<Doc> {
  return toResult(() => parse(comment));
}

function formatDocComment(doc: Doc, sourceLink: string | null): string {
  const fDesc = formatTokens(doc.description).trimStart();
  const fAttrs = doc.attributes.map(formatAttribute).join("");

  return toLuaComment(joinNonEmpty([fDesc, sourceLink, fAttrs], "\n\n"));
}

export function formatDoc(doc: Doc, sourceLink: string | null): string {
  return joinNonEmpty([formatDocComment(doc, sourceLink), doc.lua[0]], "\n");
}

export function isDocEmpty(doc: Doc): boolean {
  return (
    doc.lua.length === 0 &&
    formatTokens(doc.description).length === 0 &&
    doc.attributes.length === 0
  );
}
