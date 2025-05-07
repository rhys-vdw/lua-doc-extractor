import { FieldAttribute } from "./attribute";
import { Doc, hasAttribute, removeAttributes } from "./doc";
import { formatFieldPath, nil } from "./lua";
import { formatType, LuaType } from "./luaType";
import { joinLines, toLuaComment } from "./utility";

export function generateField(rule: FieldAttribute, indent: string): string {
  var { name, type, description } = rule.args;
  return formatField(name, type, description, indent);
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
  const { name, type, description } = field.args;
  return formatField(name, type, description, "");
}

function formatField(
  name: readonly string[],
  type: LuaType,
  description: string,
  indent: string
) {
  let comment = description.trim();
  let value: string;
  if (type.kind === "literal") {
    value = type.value;
  } else {
    value = nil;
    comment = joinLines(comment, `@type ${formatType(type)}`);
  }

  const lua = `${indent}${formatFieldPath(name)} = ${value}`;
  return comment === "" ? lua : toLuaComment(comment, indent) + "\n" + lua;
}
