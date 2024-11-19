import { pull, remove } from "lodash";
import { Tag, Comment } from "./parser";
import { logError } from "./log";
import {
  appendLines,
  generateField,
  isClass,
  splitFirstWord,
  stripGenericParams,
} from "./utility";

export type Rule = (rule: Tag, comment: Comment) => string | null;

/**
 * Declare a function.
 */
export function functionRule(rule: Tag, comment: Comment) {
  pull(comment.tags, rule);

  const paramNames = comment.tags
    .filter((t) => t.type === "param" && t.detail.length > 0)
    .map((t) => t.detail[0].split(/\s/, 1));

  if (rule.detail.length === 0) {
    logError(`@function tag missing function name: ${rule}`);
    return null;
  }
  const [functionName, ...detail] = splitFirstWord(rule);
  appendLines(comment.description, detail);
  return (
    functionName && `function ${functionName}(${paramNames.join(", ")}) end`
  );
}

/**
 * Declare a global table.
 */
export function tableRule(rule: Tag, comment: Comment) {
  pull(comment.tags, rule);

  const [tableName, ...detail] = splitFirstWord(rule);
  if (tableName == null) {
    return null;
  }
  appendLines(comment.description, detail);
  let body = "";
  if (!isClass(comment)) {
    const fields = remove(comment.tags, (t) => t.type === "field");
    body = "\n" + fields.map(generateField).join(",\n\n") + "\n";
  }
  return `${tableName} = {${body}}`;
}

/**
 * Ensure a global table is created.
 */
export function enumRule({ detail }: Tag, comment: Comment) {
  if (comment.tags.findIndex((t) => t.type === "table") === -1) {
    return tableRule({ type: "table", detail }, comment);
  }
  return null;
}

/**
 * Ensure a table exists for every class definition so that methods can be
 * added to it.
 *
 * If the class needs to be global then it can be combined with an explicit
 * `@table` annotation.
 */
export function classRule(tag: Tag, comment: Comment) {
  if (comment.tags.findIndex((t) => t.type === "table") === -1) {
    const [className] = splitFirstWord(tag);
    return (
      "local " +
      tableRule(
        { type: "table", detail: [stripGenericParams(className)] },
        comment
      )
    );
  }
  return null;
}
