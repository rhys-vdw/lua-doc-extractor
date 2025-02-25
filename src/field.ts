import { FieldAttribute } from "./attribute";
import { Doc, hasAttribute, removeAttributes } from "./doc";
import { logError, logWarning } from "./log";
import { isKeyword } from "./lua";
import { formatAttribute, toLuaComment } from "./utility";

export function generateField(rule: FieldAttribute, indent: string): string {
  if (rule.field == null) {
    logWarning(
      `Invalid attribute, field name expected: ${formatAttribute(rule)}`
    );
  }
  if (rule.field == null) {
    console.error(`No field property`, rule);
    return "";
  }
  var { name, description } = rule.field;
  return formatField(name, description.trimStart(), indent);
}

export function formatField(name: string, description: string, indent: string) {
  const fieldName = isKeyword(name) ? `["${name}"]` : name;
  return (
    toLuaComment(`@type ${description.trimEnd()}`, indent) +
    `\n${indent}${fieldName} = nil`
  );
}

/**
 * Render any fields that are not associated with a table.
 *
 * Note that this should be run after table attributes have beeen added to
 * classes and enums, but before tables are rendered (which removes the table
 * attribute).
 */
export function renderStandaloneFields(docs: Doc[]): Doc[] {
  docs.forEach((doc) => {
    // Only generate fields in tables.
    if (hasAttribute(doc, "table")) {
      return;
    }

    const fields = removeAttributes(doc, "field");
    doc.lua.push(...fields.map(renderField).filter((r) => r != null));
  });

  return docs;
}

/**
 * Render a field attribute.
 */
function renderField(field: FieldAttribute) {
  if (field.rawText.length === 0) {
    logError(`@field tag missing type: ${formatAttribute(field)}`);
    return null;
  }

  const { name, description } = field.field;
  return formatField(name, description.trimStart(), "");
}
