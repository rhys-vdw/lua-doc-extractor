import { formatType, LuaType } from "./luaType";

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
  args: { name: string; description: string };
}

export interface GlobalAttribute extends Omit<FieldAttribute, "attributeType"> {
  attributeType: "global";
}

export interface FieldAttribute extends BaseAttribute {
  attributeType: "field";
  args: { tables: []; name: string; type: LuaType; description: string };
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

function format(attr: string, rest: string) {
  return `@${attr}${ensureLeadingWhitespace(rest.trimEnd())}`;
}

export function formatAttribute(attribute: Readonly<Attribute>): string {
  const known = attribute as KnownAttribute;
  if (known.attributeType === "function" || known.attributeType == "table") {
    console.log(
      `Attempting to format internal attribute type '${known.attributeType}'`
    );
    return "";
  }
  switch (known.attributeType) {
    case "param":
    case "enum":
    case "class": {
      const { name, description } = known.args;
      return format(known.attributeType, `${name} ${description}`);
    }
    case "field":
    case "global": {
      const { name, type, description } = known.args;
      return format(
        known.attributeType,
        `${name}: ${formatType(type)} ${description}`
      );
    }
  }
  // @ts-ignore
  return format(attribute.attributeType, attribute.args.description);
}

function ensureLeadingWhitespace(str: string): string {
  if (str === "") {
    return "";
  }
  return /\s/.test(str[0]) ? str : ` ${str}`;
}
