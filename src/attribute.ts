import { LuaType } from "./luaType";

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
  attributeType: string;
  args: { description: string; [key: string]: string };
  options: {};
}

export interface DefaultAttribute extends BaseAttribute {
  attributeType: Exclude<
    string,
    "class" | "enum" | "field" | "global" | "table"
  >;
}

export interface FunctionAttribute extends BaseAttribute {
  attributeType: "function";
  args: { name: string; description: string };
}

export interface ParamAttribute extends BaseAttribute {
  attributeType: "param";
  args: { name: string; description: string };
}

export interface EnumAttribute extends BaseAttribute {
  attributeType: "enum";
  args: { name: string; description: string };
}

export interface TableAttribute extends BaseAttribute {
  attributeType: "table";
  args: { name: string; description: string };
  options: { isLocal: boolean };
}

export interface ClassAttribute extends BaseAttribute {
  attributeType: "class";
  args: { name: string; description: string };
}

export interface GlobalAttribute extends Omit<FieldAttribute, "attributeType"> {
  attributeType: "global";
}

export interface FieldAttribute extends BaseAttribute {
  attributeType: "field";
  args: { name: string; typeName: string; description: string };
  options: { type: LuaType };
}

export function createAttribute<TType extends string>(
  type: TType,
  args: Extract<Attribute, { attributeType: TType }>["args"],
  options: Extract<Attribute, { attributeType: TType }>["options"]
): Extract<Attribute, { attributeType: TType }> {
  return { attributeType: type, args, options } as Attribute as any;
}

export function isAttribute<TType extends string>(
  attr: Attribute,
  name: TType
): attr is Extract<Attribute, { attributeType: TType }> {
  return attr.attributeType === name;
}

export function formatAttribute(attribute: Readonly<Attribute>): string {
  const { attributeType, args } = attribute;
  var argValues = Object.values(args);
  return `@${attributeType}${argValues
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
