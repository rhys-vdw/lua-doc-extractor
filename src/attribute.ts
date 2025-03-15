import { formatType, LuaNamedType, LuaType } from "./luaType";

export type Attribute = KnownAttribute | DefaultAttribute;

export type KnownAttribute =
  | ClassAttribute
  | EnumAttribute
  | FieldAttribute
  | FunctionAttribute
  | GlobalAttribute
  | ParamAttribute
  | TableAttribute;

interface BaseAttribute {
  attributeType: string;
  args: { description: string };
}

export interface DefaultAttribute extends BaseAttribute {}

export interface FunctionAttribute extends BaseAttribute {
  attributeType: "function";
  args: { tables: string[]; name: string; description: string };
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
  args: { isLocal: boolean; name: string; description: string };
}

export interface ClassAttribute extends BaseAttribute {
  attributeType: "class";
  args: { type: LuaNamedType; description: string };
}

export interface GlobalAttribute extends Omit<FieldAttribute, "attributeType"> {
  attributeType: "global";
}

export interface FieldAttribute extends BaseAttribute {
  attributeType: "field";
  args: { tables: string[]; name: string; type: LuaType; description: string };
}

export function createAttribute<TType extends string>(
  type: TType,
  args: Extract<Attribute, { attributeType: TType }>["args"]
): Extract<Attribute, { attributeType: TType }> {
  return { attributeType: type, args } as Attribute as any;
}

export function isAttribute<TType extends string>(
  attr: Attribute,
  name: TType
): attr is Extract<Attribute, { attributeType: TType }> {
  return attr.attributeType === name;
}

function format(attr: string, ...rest: string[]) {
  return `@${attr}${rest
    .map((e) => ensureLeadingWhitespace(e.trimEnd()))
    .join("")}`;
}

export function formatAttribute(attribute: Readonly<Attribute>): string {
  const known = attribute as KnownAttribute;
  switch (known.attributeType) {
    case "global":
    case "function":
    case "table":
      console.error(
        `Attempting to format internal attribute type '${known.attributeType}'`
      );
      return "";
    case "param":
    case "enum": {
      const { name, description } = known.args;
      return format(known.attributeType, name, description);
    }
    case "class": {
      const { type, description } = known.args;
      return format(known.attributeType, formatType(type), description);
    }
    case "field": {
      const { name, type, description } = known.args;
      return format(known.attributeType, name, formatType(type), description);
    }
  }
  // @ts-ignore: Unreachable code error due to false exhaustive switch.
  return format(attribute.attributeType, attribute.args.description);
}

function ensureLeadingWhitespace(str: string): string {
  if (str === "") {
    return "";
  }
  return /\s/.test(str[0]) ? str : ` ${str}`;
}
