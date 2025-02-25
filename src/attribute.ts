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
  rawText: string;
}

export interface DefaultAttribute extends BaseAttribute {
  type: Exclude<string, "class" | "enum" | "field" | "global" | "table">;
}

export interface FunctionAttribute extends BaseAttribute {
  type: "function";
  function: { name: string; description: string };
}

export interface ParamAttribute extends BaseAttribute {
  type: "param";
  param: { name: string; description: string };
}

export interface EnumAttribute extends BaseAttribute {
  type: "enum";
  enum: { name: string };
}

export interface TableAttribute extends BaseAttribute {
  type: "table";
  table: { name: string; isLocal: boolean; description: string };
}

export interface ClassAttribute extends BaseAttribute {
  type: "class";
  class: { name: string };
}

export interface GlobalAttribute extends BaseAttribute {
  type: "global";
  global: { name: string; description: string };
}

export interface FieldAttribute extends BaseAttribute {
  type: "field";
  field: { name: string; description: string };
}

export function createAttribute<TType extends string>(
  type: TType,
  rawText: string = "",
  data?: any
): Extract<Attribute, { type: TType }> {
  if (data != null && typeof data.name === "string") {
    rawText = ` ${data.name}${rawText}`;
  }
  return { type, rawText, [type]: data } as any;
}

export function isAttribute<TType extends string>(
  attr: Attribute,
  name: TType
): attr is Extract<Attribute, { type: TType }> {
  return attr.type === name;
}
