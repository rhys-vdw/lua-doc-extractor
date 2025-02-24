import { pull, remove } from "lodash";
import { Attribute, FieldAttribute } from "./attribute";
import { Doc } from "./doc";
import { logError } from "./log";
import {
  formatAttribute,
  generateField,
  joinLines,
  splitFirstWord,
  stripGenericParams,
} from "./utility";

export type Rule = (ruleAttr: Attribute, doc: Doc) => void;

export const globalRule: Rule = (ruleAttr: Attribute, doc) => {
  if (ruleAttr.type !== "global") {
    logError(`@global tag failed to parse.`);
    return;
  }

  pull(doc.attributes, ruleAttr);

  if (ruleAttr.description.length === 0) {
    logError(`@global tag missing type: ${formatAttribute(ruleAttr)}`);
    return;
  }

  doc.lua.push(generateField(ruleAttr as FieldAttribute, ""));
};

/**
 * Declare a function.
 */
export const functionRule: Rule = (ruleAttr, doc) => {
  pull(doc.attributes, ruleAttr);

  const split = splitFirstWord(ruleAttr);

  if (split == null) {
    logError(`@function tag missing function name: ${ruleAttr}`);
    return;
  }

  const [functionName, description] = split;

  const paramNames = doc.attributes
    .filter((t) => t.type === "param" && t.description.length > 0)
    .map((t) => splitFirstWord(t)?.[0] ?? "");

  if (description != null) {
    doc.description = joinLines(doc.description, description);
  }
  doc.lua.push(`function ${functionName}(${paramNames.join(", ")}) end`);
};

/**
 * Declare a global table.
 */
export const tableRule: Rule = (ruleAttr, doc) => {
  pull(doc.attributes, ruleAttr);

  const split = splitFirstWord(ruleAttr);

  if (split == null) {
    logError(
      `@${ruleAttr.type} tag missing table name: ${ruleAttr.description}`
    );
    return;
  }

  const [tableName, detail] = split;

  if (detail != null) {
    doc.description = joinLines(doc.description, detail);
  }
  doc.lua.push(formatTable(tableName, formatTableFields(doc.attributes)));
};

/**
 * Ensure a global table is created.
 */
export const enumRule: Rule = (ruleAttr: Attribute, doc: Doc) => {
  if (doc.attributes.findIndex((t) => t.type === "table") === -1) {
    // NOTE: Don't do anything with the remaining text, as it will be retained
    // on the `@enum` tag.
    const split = splitFirstWord(ruleAttr);

    if (split == null) {
      logError(
        `@${ruleAttr.type} tag missing class name: ${ruleAttr.description}`
      );
      return;
    }

    const [enumName] = split;

    doc.lua.push(formatTable(enumName, formatTableFields(doc.attributes)));
  }
};

/**
 * Ensure a table exists for every class definition so that methods can be
 * added to it.
 *
 * If the class needs to be global then it can be combined with an explicit
 * `@table` annotation.
 */
export const classRule: Rule = (ruleAttr, doc): void => {
  if (doc.attributes.findIndex((t) => t.type === "table") === -1) {
    // NOTE: Don't do anything with the remaining text, as it will be retained
    // on the `@class` tag.
    const split = splitFirstWord(ruleAttr);

    if (split == null) {
      logError(
        `@${ruleAttr.type} tag missing class name: ${ruleAttr.description}`
      );
      return;
    }

    const [className] = split;
    const tableName = stripGenericParams(className);

    doc.lua.push(
      `local ${formatTable(tableName, formatTableFields(doc.attributes))}`
    );
  }
};

/**
 * Strips any provided fields and returns the generated table definition.
 * @param tableName The name of the table.
 * @param attributes Any `@field` attribute will be removed and returned in the table definition.
 */
function formatTable(tableName: string, body: string): string {
  return `${tableName.trimEnd()} = {${body}}`;
}

function formatTableFields(attributes: Attribute[]): string {
  const fields = remove(attributes, (t) => t.type === "field");

  if (fields.length === 0) {
    return "";
  }

  return (
    "\n" +
    fields.map((f) => generateField(f as FieldAttribute, "\t")).join(",\n\n") +
    "\n"
  );
}
