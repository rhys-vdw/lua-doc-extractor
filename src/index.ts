import { logWarning } from "./log";
import {
  classRule,
  enumRule,
  functionRule,
  globalRule,
  Rule,
  tableRule,
} from "./rules";
import {
  joinLines,
  formatAttribute,
  formatTokens,
  joinNonEmpty,
  splitFirstWord,
  toLuaComment,
  trimStart,
  trimTrailingWhitespace,
} from "./utility";
import { isEmpty, without } from "lodash";
import { formatSource } from "./source";
import { getComments } from "./comment";
import { parseDoc, Attribute, Doc } from "./doc";
import { fail, isSuccess, Result, success } from "./result";
import { header } from "./header";

interface LuaResult {
  lua: string;
  docErrors: Error[];
}

export function extract(
  path: string,
  source: string,
  repoUrl?: string
): Result<LuaResult> {
  const [luaResult, error] = members(source, path, repoUrl);

  if (error != null) {
    return fail(error);
  }

  const { lua, docErrors } = luaResult;

  return success({
    lua: trimTrailingWhitespace(`${header(path)}\n\n${lua}`),
    docErrors,
  });
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

function getDocs(source: string, path: string): Result<[Doc[], Error[]]> {
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

export function members(
  source: string,
  path: string,
  repoUrl?: string
): Result<LuaResult> {
  const [docResult, error] = getDocs(source, path);
  if (error != null) {
    return fail(error);
  }
  let [docs, docErrors] = docResult;

  docs = mergeTables(docs);
  const members = docs.reduce((acc, doc) => {
    applyRules(doc);
    const description = formatTokens(trimStart(doc.description));

    if (
      doc.lua.length === 0 &&
      isEmpty(description) &&
      doc.attributes.length == 0
    ) {
      return acc;
    }

    let sourceLink = null;
    if (repoUrl != null) {
      sourceLink = `${formatSource(repoUrl, {
        path,
        start: doc.start,
        end: doc.end,
      })}`;
    }

    const formattedTags = doc.attributes.map(formatAttribute).join("");

    const comment = toLuaComment(
      joinNonEmpty([description, sourceLink, formattedTags], "\n\n")
    );

    acc.push(joinNonEmpty([comment, doc.lua[0]], "\n"));
    return acc;
  }, [] as string[]);
  return success({ lua: members.join("\n\n"), docErrors });
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
