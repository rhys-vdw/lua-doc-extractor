import { pull, remove } from "lodash";
import { logError } from "./log";
import {
  joinLines,
  formatAttribute,
  formatTokens,
  generateField,
  isClass,
  splitFirstWord,
  stripGenericParams,
} from "./utility";
import { Attribute, Doc } from "./doc";

export type Rule = (ruleAttr: Attribute, doc: Doc) => string | null;

export function globalRule(ruleAttr: Attribute, comment: Doc) {
  pull(comment.attributes, ruleAttr);

  if (ruleAttr.description.length === 0) {
    logError(`@global tag missing type: ${formatAttribute(ruleAttr)}`);
    return null;
  }
  return generateField(ruleAttr, "");
}

/**
 * Declare a function.
 */
export function functionRule(ruleAttr: Attribute, doc: Doc) {
  pull(doc.attributes, ruleAttr);

  const [functionName, ...description] = splitFirstWord(ruleAttr);

  if (functionName == null) {
    logError(`@function tag missing function name: ${ruleAttr}`);
    return null;
  }

  const paramNames = doc.attributes
    .filter((t) => t.type === "param" && t.description.length > 0)
    .map((t) => splitFirstWord(t)[0]?.text ?? "");

  doc.description = joinLines(doc.description, description);

  return (
    functionName && `function ${functionName}(${paramNames.join(", ")}) end`
  );
}

/**
 * Declare a global table.
 */
export function tableRule(ruleAttr: Attribute, doc: Doc): string | null {
  pull(doc.attributes, ruleAttr);

  const [tableName, ...detail] = splitFirstWord(ruleAttr);

  if (tableName == null) {
    logError(
      `@${ruleAttr.type} tag missing table name: ${formatTokens(
        ruleAttr.description
      )}`
    );
    return null;
  }

  doc.description = joinLines(doc.description, detail);
  let body = "";
  if (!isClass(doc)) {
    const fields = remove(doc.attributes, (t) => t.type === "field");
    body =
      fields.length === 0
        ? ""
        : "\n" + fields.map((f) => generateField(f, "\t")).join(",\n\n") + "\n";
  }
  return `${tableName} = {${body}}`;
}

/**
 * Ensure a global table is created.
 */
export function enumRule(
  { description }: Attribute,
  comment: Doc
): string | null {
  if (comment.attributes.findIndex((t) => t.type === "table") === -1) {
    return tableRule({ type: "table", description }, comment);
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
export function classRule(ruleAttr: Attribute, doc: Doc) {
  if (doc.attributes.findIndex((t) => t.type === "table") === -1) {
    // NOTE: Don't do anything with the remaining text, as it will be retained
    // on the `@class` tag.
    const [classToken] = splitFirstWord(ruleAttr);
    const tableName = stripGenericParams(classToken.text);
    return (
      "local " +
      tableRule(
        {
          type: "table",
          description: [{ ...classToken, text: tableName, value: tableName }],
        },
        doc
      )
    );
  }
  return null;
}
