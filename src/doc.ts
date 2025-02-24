import nearley from "nearley";
import grammar from "./grammar.ne";
import { Comment } from "./comment";

import { Token } from "moo";
import { formatSource, Position } from "./source";
import { formatAttribute, joinNonEmpty, toLuaComment } from "./utility";
import { Result, toResult } from "./result";
import { Attribute } from "./attribute";

export interface Doc {
  description: string;
  attributes: Attribute[];
  path?: string;
  start: Position;
  end: Position;
  lua: string[];
}

function parse(comment: Comment): Doc {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  const { text, start, end } = comment;
  // Force final newline.
  parser.feed(text + "\n");
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
    throw new Error(`No parser output for comment:\n----\n${text}\n----\n`);
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
  const fDesc = doc.description.trimStart();
  const fAttrs = doc.attributes.map(formatAttribute).join("");

  return toLuaComment(joinNonEmpty([fDesc, sourceLink, fAttrs], "\n\n"));
}

export function formatDoc(doc: Doc, repoUrl: string | null): string {
  let sourceLink = null;
  if (repoUrl && doc.path) {
    sourceLink = `${formatSource(repoUrl, {
      path: doc.path,
      start: doc.start,
      end: doc.end,
    })}`;
  }

  return joinNonEmpty([formatDocComment(doc, sourceLink), doc.lua[0]], "\n");
}

export function isDocEmpty(doc: Doc): boolean {
  return (
    doc.lua.length === 0 &&
    doc.description.trim() === "" &&
    doc.attributes.length === 0
  );
}
