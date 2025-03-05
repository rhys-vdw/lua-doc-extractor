export type Attribute =
  | ClassAttribute
  | DefaultAttribute
  | EnumAttribute
  | FieldAttribute
  | FunctionAttribute
  | GlobalAttribute
  | ParamAttribute
  | TableAttribute;

interface BaseAttribute {
  args: { description: string };
  options: {};
}

export interface Type {
  name: string;
  isLiteral: boolean;
}

export interface DefaultAttribute extends BaseAttribute {
  type: Exclude<string, "class" | "enum" | "field" | "global" | "table">;
}

export interface FunctionAttribute extends BaseAttribute {
  type: "function";
  args: { name: string; description: string };
}

export interface ParamAttribute extends BaseAttribute {
  type: "param";
  args: { name: string; description: string };
}

export interface EnumAttribute extends BaseAttribute {
  type: "enum";
  args: { name: string; description: string };
}

export interface TableAttribute extends BaseAttribute {
  type: "table";
  args: { name: string; description: string };
  options: { isLocal: boolean };
}

export interface ClassAttribute extends BaseAttribute {
  type: "class";
  args: { name: string; description: string };
}

export interface GlobalAttribute extends BaseAttribute {
  type: "global";
  args: { name: string; type: Type; description: string };
}

export interface FieldAttribute extends BaseAttribute {
  type: "field";
  args: { name: string; type: Type; description: string };
}

export function createAttribute<TType extends string>(
  type: TType,
  args: Extract<Attribute, { type: TType }>["args"],
  options: Extract<Attribute, { type: TType }>["options"]
): Extract<Attribute, { type: TType }> {
  return { type, args, options } as any;
}

export function isAttribute<TType extends string>(
  attr: Attribute,
  name: TType
): attr is Extract<Attribute, { type: TType }> {
  return attr.type === name;
}

export function formatAttribute(attribute: Readonly<Attribute>): string {
  const { type, args } = attribute;
  var argValues = Object.values(args);
  return `@${type}${argValues
    .map(String) // TODO:
    .map(ensureLeadingWhitespace)
    .join("")
    .trimEnd()}`;
}

function ensureLeadingWhitespace(str: string): string {
  if (str === "") {
    return "";
  }
  return /\s/.test(str[0]) ? str : ` ${str}`;
}
