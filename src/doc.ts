import nearley from "nearley";
import { Comment } from "./comment";
import grammar from "./grammar.ne";

import { remove } from "lodash";
import { Attribute } from "./attribute";
import { Result, toResult } from "./result";
import { formatSource, Position } from "./source";
import { formatAttribute, joinNonEmpty, toLuaComment } from "./utility";

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

/**
 * Find an attribute of a given type in a document.
 * @param doc The document to search.
 * @param type The type of attribute to find.
 * @returns The attribute if found, otherwise null.
 */
export function findAttribute<TType extends string>(
  doc: Doc,
  type: TType
): Extract<Attribute, { type: TType }> | null {
  return doc.attributes.find((d) => d.type === type) ?? (null as any);
}

/**
 * Check if a document has an attribute of a given type.
 * @param doc The document to search.
 * @param type The type of attribute to find.
 * @returns True if the document has an attribute of the given type.
 */
export function hasAttribute(doc: Doc, type: Attribute["type"]): boolean {
  return doc.attributes.some((d) => d.type === type);
}

/**
 * Remove all attributes of a given type from a document and return them.
 * @param doc The document to remove attributes from.
 * @param type The type of attribute to remove.
 * @returns The removed attributes.
 */
export function removeAttributes<TType extends string>(
  doc: Doc,
  type: TType
): Extract<Attribute, { type: TType }>[] {
  return remove(doc.attributes, (d) => d.type === type) as any;
}

/**
 * Return all attributes of a given type from a document.
 * @param doc The document to remove attributes from.
 * @param type The type of attribute to remove.
 * @returns The removed attributes.
 */
export function filterAttributes<TType extends string>(
  doc: Doc,
  type: TType
): Extract<Attribute, { type: TType }>[] {
  return doc.attributes.filter((d) => d.type === type) as any;
}
