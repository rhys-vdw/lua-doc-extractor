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
  Type = "type",
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
  readonly kind: LuaTypeKind.Type;
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
  switch (luaType.kind) {
    case LuaTypeKind.Literal:
      return luaType.value;
    case LuaTypeKind.Type:
      return luaType.generics.length === 0
        ? luaType.name
        : `${luaType.name}<${luaType.generics.map(formatType).join(", ")}>`;
    case LuaTypeKind.Array:
      return `${formatType(luaType.arrayType)}[]`;
    case LuaTypeKind.Union:
      return `(${luaType.types.map(formatType).join("|")})`;
    case LuaTypeKind.Dictionary:
      return `{ [${formatType(luaType.keyType)}]: ${formatType(
        luaType.valueType
      )} }`;
    case LuaTypeKind.Function:
      return `fun(${luaType.parameters
        .map(([name, type]) => `${name}: ${formatType(type)}`)
        .join(", ")}): ${formatType(luaType.returnType)}`;
    case LuaTypeKind.Tuple:
      return `[${luaType.elementTypes.map(formatType).join(", ")}]`;
  }
}
