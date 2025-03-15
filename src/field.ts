import { FieldAttribute } from "./attribute";
import { Doc, hasAttribute, removeAttributes } from "./doc";
import { isKeyword } from "./lua";
import { formatType, LuaType } from "./luaType";
import { toLuaComment } from "./utility";

export function generateField(rule: FieldAttribute, indent: string): string {
  var { tables, name, type, description } = rule.args;
  return formatField(tables, name, type, description.trimStart(), indent);
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
function renderField(field: FieldAttribute): string {
  const { tables, name, type, description } = field.args;
  return formatField(tables, name, type, description, "");
}

function formatField(
  tables: string[],
  name: string,
  type: LuaType,
  description: string,
  indent: string
) {
  const fieldName = isKeyword(name) ? `["${name}"]` : name;
  const qualifiedName = [...tables, fieldName].join(".");
  if (type.kind === "literal") {
    const d = description.trimEnd();
    const lua = `${indent}${qualifiedName} = ${type.value}`;
    return d === "" ? lua : toLuaComment(d, indent) + "\n" + lua;
  }

  // NOTE: Since complex types are not properly parsed, the description must be
  // inlined as it will include some of the actual type.
  return (
    toLuaComment(`@type ${formatType(type)} ${description.trim()}`, indent) +
    `\n${indent}${qualifiedName} = nil`
  );
}
