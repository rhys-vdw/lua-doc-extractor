import { without } from "lodash";
import { getComments } from "./comment";
import { Doc, formatDoc, isDocEmpty, parseDoc } from "./doc";
import { header } from "./header";
import { logWarning } from "./log";
import { fail, Result, success } from "./result";
import {
  classRule,
  enumRule,
  functionRule,
  globalRule,
  Rule,
  tableRule,
} from "./rules";
import {
  formatAttribute,
  joinLines,
  splitFirstWord,
  trimTrailingWhitespace,
} from "./utility";

interface LuaResult {
  lua: string;
  docErrors: Error[];
}

export function addHeader(body: string): string {
  return trimTrailingWhitespace(`${header()}\n\n${body}`);
}

function mergeTables(docs: Doc[]): Doc[] {
  const byTable = new Map<string, Doc>();
  const result = [] as Doc[];

  docs.forEach((doc) => {
    const tableAttr =
      doc.attributes.find((a) => a.type === "table") ||
      doc.attributes.find((a) => a.type === "enum");

    if (tableAttr != null) {
      // Get table name from the tag.
      const [tableToken, ...detail] = splitFirstWord(tableAttr);
      const table = tableToken?.text;
      if (table != null) {
        if (byTable.has(table)) {
          const prev = byTable.get(table)!;

          // Merge descriptions with a blank line.
          prev.description = joinLines(prev.description, doc.description);

          // Merge in the additional detail from the table tag.
          prev.description = joinLines(prev.description, detail);

          // Merge all tags, but skip the duplicate table tag.
          prev.attributes.push(...without(doc.attributes, tableAttr));

          // Exit early to remove comment from list.
          return;
        } else {
          byTable.set(table, doc);
        }
      }
    }

    // If we didn't merge this comment into another.
    result.push(doc);
  });

  return result;
}

export function getDocs(
  source: string,
  path: string
): Result<[Doc[], Error[]]> {
  const [comments, error] = getComments(source);
  if (error != null) {
    return fail(error);
  }
  const docs = [] as Doc[];
  const docErrors = [] as Error[];
  comments.map(parseDoc).forEach(([doc, error]) => {
    if (error != null) {
      docErrors.push(error);
    } else {
      doc.path = path;
      docs.push(doc);
    }
  });
  return success([docs, docErrors]);
}

export function processDocs(docs: Doc[]): Doc[] {
  const merged = mergeTables(docs);
  merged.forEach(applyRules);
  return merged;
}

export function formatDocs(
  docs: Readonly<Doc[]>,
  repoUrl: string | null
): string {
  const members = docs
    .filter((e) => !isDocEmpty(e))
    .map((d) => formatDoc(d, repoUrl));

  return members.join("\n\n");
}

const ruleHandlers = {
  global: globalRule,
  function: functionRule,
  table: tableRule,
  enum: enumRule,
  class: classRule,
} as Record<string, Rule | undefined>;

/**
 * Apply custom attribute rules, which may generate a declaration or remove tags
 * from the comment.
 * @return Lua declaration or null.
 */
function applyRules(doc: Doc): void {
  // Keep a copy of attributes so we can modify the original.
  const prevAttrs = [...doc.attributes];
  prevAttrs.forEach((t) => {
    const handler = ruleHandlers[t.type];
    if (handler != null) {
      handler(t, doc);
    }
  });

  if (doc.lua.length > 1) {
    logWarning(
      `Multiple generators found:\n - ${prevAttrs
        .map(formatAttribute)
        .join("\n - ")}`
    );
  }
}
