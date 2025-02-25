import { pull } from "lodash";
import { Attribute, FieldAttribute, isAttribute } from "./attribute";
import { Doc, filterAttributes, hasAttribute, removeAttributes } from "./doc";
import { formatField, generateField } from "./field";
import { logError, logWarning } from "./log";
import { formatAttribute, joinLines } from "./utility";

export type Rule = (ruleAttr: Attribute, doc: Doc) => void;

export const globalRule: Rule = (ruleAttr, doc) => {
  if (!isAttribute(ruleAttr, "global")) {
    logError(`Invalid table attribute: ${ruleAttr.type}`);
    return;
  }

  pull(doc.attributes, ruleAttr);

  if (ruleAttr.rawText.length === 0) {
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

  const { name, description } = ruleAttr.function;

  const paramNames = filterAttributes(doc, "param").map((t) => t.param.name);

  if (description != null) {
    doc.description = joinLines(doc.description, description);
  }

  doc.lua.push(`function ${name}(${paramNames.join(", ")}) end`);
};

/**
 * Declare a table.
 */
export const tableRule: Rule = (ruleAttr, doc) => {
  // Ensure this is a TableAttribute.
  if (!isAttribute(ruleAttr, "table")) {
    logError(`Invalid table attribute: ${ruleAttr.type}`);
    return;
  }

  // Remove the table attribute from the list.
  pull(doc.attributes, ruleAttr);

  // Add the table description to the main doc.
  doc.description = joinLines(doc.description, ruleAttr.table.description);

  // Generate code.
  const { name, isLocal } = ruleAttr.table;
  const fieldAttrs = hasAttribute(doc, "class")
    ? []
    : removeAttributes(doc, "field");
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

export function applyRules(docs: Doc[]): Doc[] {
  docs.forEach(apply);
  return docs;
}

const ruleHandlers = {
  global: globalRule,
  function: functionRule,
  table: tableRule,
} as Record<string, Rule | undefined>;

/**
 * Apply custom attribute rules, which may generate a declaration or remove tags
 * from the comment.
 * @return Lua declaration or null.
 */
function apply(doc: Doc): void {
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
