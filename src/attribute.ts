export type Attribute =
  | ClassAttribute
  | TableAttribute
  | FieldAttribute
  | EnumAttribute
  | DefaultAttribute;

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
  table: { name: string; isLocal: boolean };
}

export interface ClassAttribute extends BaseAttribute {
  type: "class";
  class: { name: string };
}

export interface FieldAttribute extends BaseAttribute {
  type: "field" | "global";
  field: { name: string };
}

export function createAttribute<TType extends string>(
  type: TType,
  data: any = null,
  description: string = ""
): Extract<Attribute, { type: TType }> {
  if (data != null && typeof data.name === "string") {
    description = `${data.name}${description}`;
  }
  return { type, [type]: data, description } as any;
}

export function isAttribute<TType extends string>(
  attr: Attribute,
  name: TType
): attr is Extract<Attribute, { type: TType }> {
  return attr.type === name;
}
