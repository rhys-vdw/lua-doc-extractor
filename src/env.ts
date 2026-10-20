import { createAttribute } from "./attribute";
import { Doc, filterAttributes, hasAttribute, removeAttributes } from "./doc";

// `@env` names the Lua environments (handles) a doc's subject is registered
// in. It steers routing in `projectOutputs` and is stripped before output.
export function removeEnvAttributes(docs: Doc[]): Doc[] {
  for (const doc of docs) {
    removeAttributes(doc, "env");
  }
  return docs;
}

// Doc types that mark a doc as "declaring something" (function, table, class,
// etc.). A doc that has a `@env` and none of these is a file-level marker
// — its envs apply to every other doc in the same file.
const DECLARATION_ATTR_TYPES = [
  "function",
  "table",
  "class",
  "enum",
  "global",
  "field",
] as const;

function isFileLevelEnvDoc(doc: Doc): boolean {
  return (
    hasAttribute(doc, "env") &&
    !DECLARATION_ATTR_TYPES.some((t) => hasAttribute(doc, t))
  );
}

// The env names a doc carries, deduplicated across its `@env` attributes
// (e.g. `@env server, client`).
export function getDocEnvs(doc: Doc): string[] {
  const envs = new Set<string>();
  for (const attr of filterAttributes(doc, "env")) {
    for (const name of attr.args.names) envs.add(name);
  }
  return [...envs];
}

// Find file-level `@env` markers (a standalone doc with only `@env` and no
// declaration) and propagate their envs onto every other doc in the same file
// that doesn't already have one. The marker doc is then removed. Returns
// authoring errors (e.g. multiple markers per file, marker not at file start)
// rather than throwing.
export function applyFileEnvs(
  fileEntries: readonly (readonly [string, Doc[]])[],
): string[] {
  const errors: string[] = [];
  for (const [path, docs] of fileEntries) {
    const markerIndices: number[] = [];
    for (let i = 0; i < docs.length; i++) {
      if (isFileLevelEnvDoc(docs[i])) markerIndices.push(i);
    }
    if (markerIndices.length === 0) continue;
    if (markerIndices.length > 1) {
      errors.push(
        `'${path}': multiple file-level @env docs (found ${markerIndices.length}, expected at most 1)`,
      );
      continue;
    }
    if (markerIndices[0] !== 0) {
      errors.push(
        `'${path}': file-level @env doc must be the first doc in the file`,
      );
      continue;
    }
    const fileEnvs = getDocEnvs(docs[0]);
    docs.splice(0, 1);
    if (fileEnvs.length === 0) continue;
    for (const doc of docs) {
      if (hasAttribute(doc, "env")) continue;
      doc.attributes.push(
        createAttribute("env", { names: fileEnvs, description: "" }),
      );
    }
  }
  return errors;
}

// The key a set of env names routes by: sorted and comma-joined, so
// `@env client, server` meets `--env server,client=common.lua`.
export function envKey(envs: readonly string[]): string {
  return [...new Set(envs.map((e) => e.trim()).filter(Boolean))]
    .sort()
    .join(",");
}

// `--env` values: the output file for each set of env names.
export type EnvOutputs = ReadonlyMap<string, string>;

// Parse `--env name[,name...]=file` values into an `EnvOutputs` map.
export function parseEnvOutputs(
  values: readonly string[],
): [EnvOutputs, string[]] {
  const outputs = new Map<string, string>();
  const errors: string[] = [];
  for (const value of values) {
    const eq = value.indexOf("=");
    const key = eq < 0 ? "" : envKey(value.slice(0, eq).split(","));
    const file = eq < 0 ? "" : value.slice(eq + 1).trim();
    if (!key || !file) {
      errors.push(`--env '${value}': expected name[,name...]=file`);
      continue;
    }
    if (outputs.has(key)) {
      errors.push(`--env '${value}': '${key}' is already routed`);
      continue;
    }
    outputs.set(key, file);
  }
  return [outputs, errors];
}

export interface FileOutput {
  name: string;
  docs: Doc[];
  sources: string[];
}

// Group docs into output files. A doc with an `@env` goes to the file routed
// for that set of names; a doc without one goes to `defaultOutput(path)`, the
// file its source maps to. With routes given, an `@env` set none of them
// names is an error; with none given, the tags change nothing.
export function projectOutputs(
  fileEntries: readonly (readonly [string, Doc[]])[],
  envOutputs: EnvOutputs,
  defaultOutput: (path: string) => string,
): [FileOutput[], string[]] {
  const byOutput = new Map<string, { docs: Doc[]; sources: Set<string> }>();
  const errors: string[] = [];
  const reported = new Set<string>();

  for (const [path, docs] of fileEntries) {
    for (const doc of docs) {
      const envs = envOutputs.size === 0 ? [] : getDocEnvs(doc);
      let outFile: string;
      if (envs.length === 0) {
        outFile = defaultOutput(path);
      } else {
        const key = envKey(envs);
        const routed = envOutputs.get(key);
        if (routed === undefined) {
          const report = `${path}\0${key}`;
          if (!reported.has(report)) {
            reported.add(report);
            errors.push(`'${path}': no --env output for '${key}'`);
          }
          continue;
        }
        outFile = routed;
      }
      let entry = byOutput.get(outFile);
      if (!entry) {
        entry = { docs: [], sources: new Set() };
        byOutput.set(outFile, entry);
      }
      entry.docs.push(doc);
      entry.sources.add(path);
    }
  }

  const outputs: FileOutput[] = [];
  for (const [name, { docs, sources }] of byOutput) {
    outputs.push({ name, docs, sources: [...sources] });
  }
  return [outputs, errors];
}
