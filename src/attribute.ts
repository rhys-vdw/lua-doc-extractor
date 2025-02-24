export type Attribute =
  | ClassAttribute
  | TableAttribute
  | FieldAttribute
  | EnumAttribute
  | DefaultAttribute;

export interface DefaultAttribute {
  type: Exclude<string, "class" | "enum" | "field" | "global" | "table">;
  description: string;
}

export interface EnumAttribute {
  type: "enum";
  enum: { name: string };
  description: string;
}

export interface TableAttribute {
  type: "table";
  table: { name: string; isLocal: boolean };
  description: string;
}

export interface ClassAttribute {
  type: "class";
  class: { name: string };
  description: string;
}

export interface FieldAttribute {
  type: "field" | "global";
  field: { name: string; type: string };
  description: string;
}

export function isAttribute<TType extends string>(
  attr: Attribute,
  name: TType
): attr is Extract<Attribute, { type: TType }> {
  return attr.type === name;
}
