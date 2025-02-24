export type Attribute = FieldAttribute | DefaultAttribute;

export interface DefaultAttribute {
  type: Exclude<string, "field" | "global">;
  description: string;
}

export interface FieldAttribute {
  type: "field" | "global";
  field: { name: string; type: string };
  description: string;
}
