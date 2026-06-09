import {
  DefaultAttribute,
  EnumAttribute,
  FieldAttribute,
  FunctionAttribute,
  GlobalAttribute,
  TableAttribute,
} from "./attribute";
import {
  Doc,
  filterAttributes,
  hasAttribute,
  removeAttributes,
} from "./doc";
import { FileOutput } from "./output";

// Strips `@env` attributes after they've done their job in the pipeline
// (fallback routing in `outputFileFor`). `@env` is an internal signal for
// non-Spring tables — it doesn't belong in the emitted stubs.
export function removeContextAttributes(docs: Doc[]): Doc[] {
  for (const doc of docs) {
    removeAttributes(doc, "env");
  }
  return docs;
}

// Doc types that mark a doc as "declaring something" (function, table, class,
// etc.). A doc that has a `@env` and none of these is a file-level marker
// — its context applies to every other doc in the same file.
const DECLARATION_ATTR_TYPES = [
  "function",
  "table",
  "class",
  "enum",
  "global",
  "field",
] as const;

function isFileLevelContextDoc(doc: Doc): boolean {
  return (
    hasAttribute(doc, "env") &&
    !DECLARATION_ATTR_TYPES.some((t) => hasAttribute(doc, t))
  );
}

// Parse a doc's `@env` attribute list into a set of bucket names. The
// attribute grammar carries comma-separated values in `description` (e.g.
// `@env synced, unsynced`).
export function getDocContexts(doc: Doc): string[] {
  const contextAttrs = filterAttributes(doc, "env") as DefaultAttribute[];
  const contexts = new Set<string>();
  for (const attr of contextAttrs) {
    for (const part of attr.args.description.split(",")) {
      const trimmed = part.trim();
      if (trimmed) contexts.add(trimmed);
    }
  }
  return [...contexts];
}

// Find file-level `@env` markers (a standalone doc with only `@env`
// and no declaration) and propagate their context onto every other doc in the
// same file that doesn't already have one. The marker doc is then removed.
// Returns authoring errors (e.g. multiple markers per file, marker not at
// file start) rather than throwing.
export function applyFileContexts(
  fileEntries: readonly (readonly [string, Doc[]])[]
): string[] {
  const errors: string[] = [];
  for (const [path, docs] of fileEntries) {
    const markerIndices: number[] = [];
    for (let i = 0; i < docs.length; i++) {
      if (isFileLevelContextDoc(docs[i])) markerIndices.push(i);
    }
    if (markerIndices.length === 0) continue;
    if (markerIndices.length > 1) {
      errors.push(
        `'${path}': multiple file-level @env docs (found ${markerIndices.length}, expected at most 1)`
      );
      continue;
    }
    if (markerIndices[0] !== 0) {
      errors.push(
        `'${path}': file-level @env doc must be the first doc in the file`
      );
      continue;
    }
    const fileContexts = getDocContexts(docs[0]);
    docs.splice(0, 1);
    if (fileContexts.length === 0) continue;
    for (const doc of docs) {
      if (hasAttribute(doc, "env")) continue;
      for (const ctx of fileContexts) {
        doc.attributes.push({
          attributeType: "env",
          args: { description: ctx },
        });
      }
    }
  }
  return errors;
}

// Each doc that declares a table method has a qualified name like
// `SpringSynced.GiveOrderToUnit` — the first identifier is the "table name",
// the rest is the method path. Used both for output-file grouping and for
// duplicate-declaration linting.
const NAME_ATTR_TYPES = [
  "function",
  "table",
  "enum",
  "global",
  "field",
] as const;

export function getDocTableName(doc: Doc): string | null {
  for (const attr of doc.attributes) {
    switch (attr.attributeType) {
      case "table":
      case "enum":
        return (attr as TableAttribute | EnumAttribute).args.name[0] ?? null;
      case "function": {
        const name = (attr as FunctionAttribute).args.name;
        return name.length > 1 ? name[0] : null;
      }
      case "global":
      case "field": {
        const name = (attr as GlobalAttribute | FieldAttribute).args.name;
        return name.length > 1 ? name[0] : null;
      }
    }
  }
  return null;
}

function getDocQualifiedName(doc: Doc): string | null {
  for (const attr of doc.attributes) {
    if (!NAME_ATTR_TYPES.includes(attr.attributeType as any)) continue;
    const name = (attr.args as { name?: readonly string[] }).name;
    if (name && name.length > 0) return name.join(".");
  }
  return null;
}

// Authors declare Spring API methods under one of three top-level tables;
// each maps to its own output stub file. Tables outside this set (MoveCtrl,
// UnitScript, etc.) fall through to `shared.lua` — they're accessible in
// every Lua context.
const SPRING_OUTPUTS: ReadonlyMap<string, { file: string; preamble: string }> =
  new Map([
    [
      "SpringShared",
      {
        file: "shared.lua",
        preamble: "---@class SpringShared\nSpringShared = {}",
      },
    ],
    [
      "SpringSynced",
      {
        file: "synced.lua",
        preamble: "---@class SpringSynced\nSpringSynced = {}",
      },
    ],
    [
      "SpringUnsynced",
      {
        file: "unsynced.lua",
        preamble: "---@class SpringUnsynced\nSpringUnsynced = {}",
      },
    ],
  ]);

const FALLBACK_OUTPUT = "shared.lua";

// Non-Spring tables (UnitScript, ObjectRendering, etc.) don't carry a bucket
// in their `@function` prefix, so they rely on a file-level `@env` tag
// (propagated by `applyFileContexts`) to land in the right output. A single
// `synced` or `unsynced` context maps to that bucket; anything else — mixed
// contexts or unrecognized names — falls through to shared.
const CONTEXT_TO_OUTPUT: ReadonlyMap<string, string> = new Map([
  ["synced", "synced.lua"],
  ["unsynced", "unsynced.lua"],
  ["shared", "shared.lua"],
]);

function outputFileFor(doc: Doc): string {
  const table = getDocTableName(doc);
  if (table != null) {
    const entry = SPRING_OUTPUTS.get(table);
    if (entry) return entry.file;
  }
  const contexts = getDocContexts(doc);
  if (contexts.length === 1) {
    const mapped = CONTEXT_TO_OUTPUT.get(contexts[0]);
    if (mapped) return mapped;
  }
  return FALLBACK_OUTPUT;
}

// Lint pass over all input docs: flag any `@function Table.Name` declared in
// more than one file. In the split-tables-as-primary model these collisions
// are authoring bugs — the extractor used to auto-dedup them via a "promote
// to shared" step, but that magic is gone; duplicates must be consolidated
// by hand at the source.
export function lintDuplicateDeclarations(
  fileEntries: readonly (readonly [string, Doc[]])[]
): string[] {
  const errors: string[] = [];
  const firstSeen = new Map<string, string>();

  for (const [path, docs] of fileEntries) {
    for (const doc of docs) {
      // Only flag function-attribute duplicates — class/table/enum/global can
      // legitimately appear in multiple files as repeated declarations.
      const hasFunction = doc.attributes.some(
        (a) => a.attributeType === "function"
      );
      if (!hasFunction) continue;

      const qual = getDocQualifiedName(doc);
      if (qual == null) continue;

      const prev = firstSeen.get(qual);
      if (prev != null && prev !== path) {
        errors.push(
          `'${path}': duplicate @function ${qual} (also declared in '${prev}')`
        );
      } else if (prev == null) {
        firstSeen.set(qual, path);
      }
    }
  }

  return errors;
}

// Group all docs into output files based on the table prefix of each doc's
// declaration. Preamble is synthesized for the three Spring* outputs; for
// any other table (MoveCtrl et al.), the author is expected to provide a
// `@class` declaration in the source.
export function projectOutputs(
  fileEntries: readonly (readonly [string, Doc[]])[]
): FileOutput[] {
  const byOutput = new Map<
    string,
    { docs: Doc[]; sources: Set<string>; preambleParts: Set<string> }
  >();

  for (const [path, docs] of fileEntries) {
    for (const doc of docs) {
      const outFile = outputFileFor(doc);
      let entry = byOutput.get(outFile);
      if (!entry) {
        entry = { docs: [], sources: new Set(), preambleParts: new Set() };
        byOutput.set(outFile, entry);
      }
      entry.docs.push(doc);
      entry.sources.add(path);

      const table = getDocTableName(doc);
      if (table != null) {
        const springPreamble = SPRING_OUTPUTS.get(table)?.preamble;
        if (springPreamble != null) entry.preambleParts.add(springPreamble);
      }
    }
  }

  const outputs: FileOutput[] = [];
  for (const [name, { docs, sources, preambleParts }] of byOutput) {
    outputs.push({
      name,
      docs,
      sources: [...sources],
      preamble: [...preambleParts].join("\n\n"),
    });
  }
  return outputs;
}
