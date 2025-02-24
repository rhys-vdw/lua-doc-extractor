export type Attribute =
  | ClassAttribute
  | DefaultAttribute
  | EnumAttribute
  | FieldAttribute
  | GlobalAttribute
  | TableAttribute;

interface BaseAttribute {
  description: string;
}

export interface DefaultAttribute extends BaseAttribute {
  type: Exclude<string, "class" | "enum" | "field" | "global" | "table">;
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
  description: string = "",
  data: any = null
): Extract<Attribute, { type: TType }> {
  if (data != null && typeof data.name === "string") {
    description = ` ${data.name}${description}`;
  }
  return { type, description, [type]: data } as any;
}

export function isAttribute<TType extends string>(
  attr: Attribute,
  name: TType
): attr is Extract<Attribute, { type: TType }> {
  return attr.type === name;
}
