import * as project from "../package.json";
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
import { fail, Result, success } from "./result";
import dedent from "dedent-js";

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

  const header = dedent`
    ---!!! DO NOT MANUALLY EDIT THIS FILE !!!
    ---Generated by ${project.name} ${project.version}
    ---${project.homepage}
    ---
    ---Source: ${path}
    ---
    ---@meta
  `;

  return success({
    lua: trimTrailingWhitespace(`${header}\n\n${lua}`),
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

export function members(
  source: string,
  path: string,
  repoUrl?: string
): Result<LuaResult> {
  const [comments, error] = getComments(source);
  if (error != null) {
    return fail(error);
  }
  let { docs, docErrors } = comments.map(parseDoc).reduce(
    (acc, [doc, error]) => {
      if (error != null) {
        acc.docErrors.push(error);
      } else {
        acc.docs.push(doc);
      }
      return acc;
    },
    { docs: [] as Doc[], docErrors: [] as Error[] }
  );
  docs = mergeTables(docs);
  const members = docs.reduce((acc, doc) => {
    const lua = applyRules(doc);
    const description = formatTokens(trimStart(doc.description));

    if (isEmpty(lua) && isEmpty(description) && doc.attributes.length == 0) {
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

    acc.push(joinNonEmpty([comment, lua], "\n"));
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
function applyRules(comment: Doc): string | null {
  const declarations = comment.attributes.reduce((acc, t) => {
    const handler = ruleHandlers[t.type];
    if (handler != null) {
      const declaration = handler(t, comment);
      if (declaration != null) {
        acc.push([t, declaration]);
      }
    }
    return acc;
  }, [] as [Attribute, string][]);

  if (declarations.length == 0) {
    return null;
  }

  if (declarations.length > 1) {
    logWarning(
      `Incompatible attributes found:\n - ${declarations
        .map(([attr, _]) => formatAttribute(attr))
        .join("\n - ")}`
    );
  }

  return declarations[0][1];
}
