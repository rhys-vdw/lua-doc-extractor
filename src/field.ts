import { FieldAttribute } from "./attribute";
import { Doc, hasAttribute, removeAttributes } from "./doc";
import { isKeyword } from "./lua";
import { toLuaComment } from "./utility";

export function generateField(rule: FieldAttribute, indent: string): string {
  var { name, value, description } = rule.args;
  return formatField(name, value, description.trimStart(), indent);
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

/** Render a field attribute. */
function renderField(field: FieldAttribute): string | null {
  const { name, value, description } = field.args;
  return formatField(name, value, description.trimStart(), "");
}

function formatField(
  name: string,
  value: string | undefined,
  description: string,
  indent: string
) {
  const fieldName = isKeyword(name) ? `["${name}"]` : name;
  if (value !== undefined) {
    const d = description.trim();
    const lua = `${indent}${fieldName} = ${value}`;
    return d === "" ? lua : toLuaComment(d, indent) + "\n" + lua;
  }
  return (
    toLuaComment(`@type ${description.trimEnd()}`, indent) +
    `\n${indent}${fieldName} = nil`
  );
}
