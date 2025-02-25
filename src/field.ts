import { FieldAttribute } from "./attribute";
import { logWarning } from "./log";
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
