import { formatTypeName } from "./lua";

export type LuaType =
  | LuaLiteralType
  | LuaNamedType
  | LuaArrayType
  | LuaUnionType
  | LuaTupleType
  | LuaDictionaryType
  | LuaTableType
  | LuaFunctionType;

type LuaTypeByKind<TKind extends LuaTypeKind> = Extract<
  LuaType,
  { kind: TKind }
>;

export type LuaTypeKind = Pick<LuaType, "kind">["kind"];

interface BaseLuaType {
  readonly kind: LuaTypeKind;
  readonly optional?: boolean;
}

/**
 * A literal number, string, boolean or nil.
 */
export interface LuaLiteralType extends BaseLuaType {
  readonly kind: "literal";
  readonly value: string;
}

/**
 * Any named class, table, enum etc, with or without generics. Includes basics
 * such as `table`, `string` etc.
 */
export interface LuaNamedType extends BaseLuaType {
  readonly kind: "named";
  readonly name: readonly string[];
  readonly generics: LuaType[];
}

/**
 * Union of multiple types.
 */
export interface LuaUnionType extends BaseLuaType {
  readonly kind: "union";
  readonly types: readonly LuaType[];
  readonly parens?: boolean;
}

/**
 * Array type.
 */
export interface LuaArrayType extends BaseLuaType {
  readonly kind: "array";
  readonly arrayType: LuaType;
}

/**
 * Tuple type.
 */
export interface LuaTupleType extends BaseLuaType {
  readonly kind: "tuple";
  readonly types: readonly LuaType[];
}

/**
 * Table with a specific key and value type.
 */
export interface LuaDictionaryType extends BaseLuaType {
  readonly kind: "dictionary";
  readonly keyType: LuaType;
  readonly valueType: LuaType;
}

/**
 * Table with named and typed keys.
 */
export interface LuaTableType extends BaseLuaType {
  readonly kind: "table";
  readonly fields: readonly [string, LuaType][];
}

/**
 * Function type.
 */
export interface LuaFunctionType extends BaseLuaType {
  readonly kind: "function";
  readonly parameters: readonly [string, LuaType][];
  readonly returnType: LuaType | null;
}

export function formatType(luaType: LuaType): string {
  const f = formatTypeWithoutOptional(luaType);
  return luaType.optional ? `${f}?` : f;
}

function formatTypeWithoutOptional(luaType: LuaType): string {
  const f = formatType;
  const t = luaType;

  switch (t.kind) {
    case "literal":
      return t.value;
    case "named":
      return t.generics.length === 0
        ? formatTypeName(t.name)
        : `${formatTypeName(t.name)}<${t.generics.map(f).join(", ")}>`;
    case "array":
      return `${f(t.arrayType)}[]`;
    case "union":
      const u = t.types.map(f).join("|");
      return t.parens ? `(${u})` : u;
    case "dictionary":
      return `{ [${f(t.keyType)}]: ${f(t.valueType)} }`;
    case "table":
      return t.fields.length === 0 ? "{}" : `{ ${params(t.fields)} }`;
    case "function":
      const ps = params(t.parameters);
      return t.returnType === null
        ? `fun(${ps})`
        : `fun(${ps}): ${f(t.returnType)}`;
    case "tuple":
      return `[${t.types.map(f).join(", ")}]`;
  }
  throw new Error(`Unknown Lua type kind: ${(t as LuaType).kind}`);
}

function params(ps: readonly [string, LuaType][]): string {
  return ps.map(([name, type]) => `${name}: ${formatType(type)}`).join(", ");
}

export function unionTypes(type: LuaType, ...types: LuaType[]): LuaType {
  if (types.length === 0) {
    return type;
  }
  return type.kind === "union" && !type.parens
    ? { ...type, types: [...type.types, ...types] }
    : { kind: "union", types: [type, ...types] };
}

export function createType<TKind extends LuaTypeKind>(
  kind: TKind,
  fields: Omit<LuaTypeByKind<TKind>, "kind">
): LuaTypeByKind<TKind> {
  return { kind, ...fields } as LuaTypeByKind<TKind>;
}
