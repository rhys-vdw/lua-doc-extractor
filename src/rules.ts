import { pull } from "lodash";
import { Attribute, FieldAttribute, isAttribute } from "./attribute";
import { Doc, removeAttributes } from "./doc";
import { logError } from "./log";
import {
  formatAttribute,
  formatField,
  generateField,
  joinLines,
  splitFirstWord,
} from "./utility";

export type Rule = (ruleAttr: Attribute, doc: Doc) => void;

export const globalRule: Rule = (ruleAttr: Attribute, doc) => {
  if (!isAttribute(ruleAttr, "global")) {
    logError(`Invalid table attribute: ${ruleAttr.type}`);
    return;
  }

  pull(doc.attributes, ruleAttr);

  if (ruleAttr.description.length === 0) {
    logError(`@global tag missing type: ${formatAttribute(ruleAttr)}`);
    return;
  }

  const { name, description } = ruleAttr.global;
  doc.lua.push(formatField(name, description.trimStart(), ""));
};

/**
 * Declare a function.
 */
export const functionRule: Rule = (ruleAttr, doc) => {
  if (!isAttribute(ruleAttr, "function")) {
    logError(`Invalid table attribute: ${ruleAttr.type}`);
    return;
  }

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
  // Ensure this is a TableAttribute.
  if (!isAttribute(ruleAttr, "table")) {
    console.error(`Invalid table attribute: ${ruleAttr.type}`);
    return;
  }

  // Remove the table attribute from the list.
  pull(doc.attributes, ruleAttr);

  // Add the table description to the main doc.
  doc.description = joinLines(doc.description, ruleAttr.table.description);

  // Generate code.
  const { name, isLocal } = ruleAttr.table;
  const fieldAttrs = removeAttributes(doc, "field");
  const fields = formatTableFields(fieldAttrs);
  if (isLocal) {
    doc.lua.push(`local ${name} = {${fields}}`);
  } else {
    doc.lua.push(`${name} = {${fields}}`);
  }
};

function formatTableFields(fields: readonly FieldAttribute[]): string {
  if (fields.length === 0) {
    return "";
  }

  return "\n" + fields.map((f) => generateField(f, "\t")).join(",\n\n") + "\n";
}
