import { pull } from "lodash";
import {
  Attribute,
  FieldAttribute,
  formatAttribute,
  isAttribute,
} from "./attribute";
import { Doc, filterAttributes, hasAttribute, removeAttributes } from "./doc";
import { generateField } from "./field";
import { logError, logWarning } from "./log";
import { joinLines } from "./utility";

export type Rule = (ruleAttr: Attribute, doc: Doc) => void;

/**
 * Declare a function.
 */
export const functionRule: Rule = (ruleAttr, doc) => {
  if (!isAttribute(ruleAttr, "function")) {
    logError(`Invalid table attribute: ${ruleAttr.type}`);
    return;
  }

  pull(doc.attributes, ruleAttr);

  const { name, description } = ruleAttr.args;

  const paramNames = filterAttributes(doc, "param").map((t) => t.args.name);

  if (description != null) {
    doc.description = joinLines(doc.description, description);
  }

  doc.lua.push(`function ${name}(${paramNames.join(", ")}) end`);
};

/**
 * Declare a table.
 */
export const tableRule: Rule = (table, doc) => {
  // Ensure this is a TableAttribute.
  if (!isAttribute(table, "table")) {
    logError(`Invalid table attribute: ${table.type}`);
    return;
  }

  // Remove the table attribute from the list.
  pull(doc.attributes, table);

  // Add the table description to the main doc.
  doc.description = joinLines(doc.description, table.args.description);

  // Generate code.
  const {
    args: { name },
    options: { isLocal },
  } = table;
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
    const attributes = prevAttrs
      .map((a, i) => `${i + 1}. ${formatAttribute(a)}`)
      .join("\n");
    const sep = "=".repeat(10);
    const lua = `${sep}\n${doc.lua.join(`\n${sep}\n`)}\n${sep}`;
    logWarning(
      `Multiple generators found:\nAttributes:${attributes}\nLua:${lua}`
    );
  }
}
