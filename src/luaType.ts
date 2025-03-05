export type LuaType =
  | LuaLiteralType
  | LuaNamedType
  | LuaArrayType
  | LuaUnionType
  | LuaTupleType
  | LuaDictionaryType
  | LuaFunctionType;

export const enum LuaTypeKind {
  Literal = "literal",
  Named = "named",
  Array = "array",
  Union = "union",
  Tuple = "tuple",
  Dictionary = "dictionary",
  Function = "function",
}

/**
 * A literal number, string, boolean or nil.
 */
export interface LuaLiteralType {
  readonly kind: LuaTypeKind.Literal;
  readonly value: string;
}

/**
 * Any named class, table, enum etc, with or without generics. Includes basics
 * such as `table`, `string` etc.
 */
export interface LuaNamedType {
  readonly kind: LuaTypeKind.Named;
  readonly name: string;
  readonly generics: LuaType[];
}

/**
 * Union of multiple types.
 */
export interface LuaUnionType {
  readonly kind: LuaTypeKind.Union;
  readonly types: LuaType[];
}

/**
 * Array type.
 */
export interface LuaArrayType {
  readonly kind: LuaTypeKind.Array;
  readonly arrayType: LuaType;
}

/**
 * Tuple type.
 */
export interface LuaTupleType {
  readonly kind: LuaTypeKind.Tuple;
  readonly elementTypes: readonly LuaType[];
}

/**
 * Table with a specific key and value type.
 */
export interface LuaDictionaryType {
  readonly kind: LuaTypeKind.Dictionary;
  readonly keyType: LuaType;
  readonly valueType: LuaType;
}

/**
 * Function type.
 */
export interface LuaFunctionType {
  readonly kind: LuaTypeKind.Function;
  readonly parameters: readonly [string, LuaType][];
  readonly returnType: LuaType;
}

export function formatType(luaType: LuaType): string {
  const f = formatType;
  const t = luaType;

  console.log("about to format type", luaType);
  switch (t.kind) {
    case LuaTypeKind.Literal:
      return t.value;
    case LuaTypeKind.Named:
      return t.generics.length === 0
        ? t.name
        : `${t.name}<${t.generics.map(f).join(", ")}>`;
    case LuaTypeKind.Array:
      return `${f(t.arrayType)}[]`;
    case LuaTypeKind.Union:
      return `(${t.types.map(f).join("|")})`;
    case LuaTypeKind.Dictionary:
      return `{ [${f(t.keyType)}]: ${f(t.valueType)} }`;
    case LuaTypeKind.Function:
      return `fun(${t.parameters
        .map(([name, type]) => `${name}: ${f(type)}`)
        .join(", ")}): ${f(t.returnType)}`;
    case LuaTypeKind.Tuple:
      return `[${t.elementTypes.map(f).join(", ")}]`;
    default:
      throw new Error(`Unknown Lua type kind: ${(t as any).kind}`);
  }
}
