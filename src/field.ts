import { FieldAttribute, Type } from "./attribute";
import { Doc, hasAttribute, removeAttributes } from "./doc";
import { isKeyword, nil } from "./lua";
import { joinLines, toLuaComment } from "./utility";

export function generateField(rule: FieldAttribute, indent: string): string {
  var { name, type, description } = rule.args;
  return formatField(name, type, description.trimStart(), indent);
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
  const { name, type, description } = field.args;
  return formatField(name, type, description, "");
}

function formatField(
  name: string,
  type: Type,
  description: string,
  indent: string
) {
  const fieldName = isKeyword(name) ? `["${name}"]` : name;
  const value = type.isLiteral ? type.name : nil;
  let lines = description.trimEnd();
  if (!type.isLiteral) {
    lines = joinLines(lines, `@type ${type.name}`);
  }
  if (type.isLiteral) {
    const d = description.trimEnd();
    const lua = `${indent}${fieldName} = ${type.name}`;
    return d === "" ? lua : toLuaComment(d, indent) + "\n" + lua;
  }
  return toLuaComment(lines, indent) + `\n${indent}${fieldName} = ${value}`;
}
