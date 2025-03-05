import nearley from "nearley";
import { Comment } from "./comment";
import grammar from "./grammar.ne";

import { remove } from "lodash";
import { Attribute, formatAttribute } from "./attribute";
import { Result, toResult } from "./result";
import { Position } from "./source";
import { joinNonEmpty, toLuaComment } from "./utility";

export interface ParseDocResult {
  description: string;
  attributes: Attribute[];
  path?: string;
}

export interface Doc {
  description: string;
  attributes: Attribute[];
  path?: string;
  start: Position;
  end: Position;
  lua: string[];
}

export function parseDoc(input: string): ParseDocResult[] {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  // Force final newline.
  parser.feed(input + "\n");
  return parser.results;
}

function unsafeParse(comment: Comment): Doc {
  const { text, start, end } = comment;
  const rawDocs = parseDoc(text);
  if (rawDocs.length > 1) {
    console.warn(
      `Ambiguous parse for comment (result count: ${rawDocs.length}):\n-----\n${text}\n----\n`
    );
  }
  if (rawDocs.length === 0) {
    throw new Error(`No parser output for comment:\n----\n${text}\n----\n`);
  }
  return {
    ...rawDocs[0],
    start,
    end,
    lua: [],
  };
}

export function getDoc(comment: Comment): Result<Doc> {
  return toResult(() => unsafeParse(comment));
}

function formatDocComment(doc: Doc): string {
  const fDesc = doc.description.trimStart();
  const fAttrs = doc.attributes.map(formatAttribute).join("\n");

  return toLuaComment(joinNonEmpty([fDesc, fAttrs], "\n\n"));
}

export function formatDoc(doc: Doc): string {
  return joinNonEmpty([formatDocComment(doc), doc.lua[0]], "\n");
}

export function removeEmptyDocs(docs: Doc[]): Doc[] {
  return docs.filter((d) => !isDocEmpty(d));
}

function isDocEmpty(doc: Doc): boolean {
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
): Extract<Attribute, { attributeType: TType }> | null {
  return doc.attributes.find((d) => d.attributeType === type) ?? (null as any);
}

/**
 * Check if a document has an attribute of a given type.
 * @param doc The document to search.
 * @param type The type of attribute to find.
 * @returns True if the document has an attribute of the given type.
 */
export function hasAttribute(
  doc: Doc,
  type: Attribute["attributeType"]
): boolean {
  return doc.attributes.some((d) => d.attributeType === type);
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
): Extract<Attribute, { attributeType: TType }>[] {
  return remove(doc.attributes, (d) => d.attributeType === type) as any;
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
): Extract<Attribute, { attributeType: TType }>[] {
  return doc.attributes.filter((d) => d.attributeType === type) as any;
}
