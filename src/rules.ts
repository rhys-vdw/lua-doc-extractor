import { pull, remove } from "lodash";
import { Tag, Comment } from "./parser";
import { logError } from "./log";
import { ensureFirstWord, generateField, isClass } from "./utility";

export type Rule = (rule: Tag, comment: Comment) => string | null;

export function functionRule(rule: Tag, comment: Comment) {
  pull(comment.tags, rule);

  const paramNames = comment.tags
    .filter((t) => t.type === "param" && t.detail.length > 0)
    .map((t) => t.detail[0].split(/\s/, 1));

  if (rule.detail.length === 0) {
    logError(`@function tag missing function name: ${rule}`);
    return null;
  }
  const functionName = ensureFirstWord(rule);
  return (
    functionName && `function ${functionName}(${paramNames.join(", ")}) end`
  );
}

export function tableRule(rule: Tag, comment: Comment) {
  pull(comment.tags, rule);

  const tableName = ensureFirstWord(rule);
  let body = "";
  if (!isClass(comment)) {
    const fields = remove(comment.tags, (t) => t.type === "field");
    body = "\n" + fields.map(generateField).join(",\n\n") + "\n";
  }
  return tableName && `${tableName} = {${body}}`;
}

export function enumRule({ detail }: Tag, comment: Comment) {
  if (comment.tags.findIndex((t) => t.type === "table") === -1) {
    return tableRule({ type: "table", detail }, comment);
  }
  return null;
}
