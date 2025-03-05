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

function format(luaType: LuaType): string {
  console.log("about to format type", luaType);
  switch (luaType.kind) {
    case LuaTypeKind.Literal:
      return luaType.value;
    case LuaTypeKind.Named:
      return luaType.generics.length === 0
        ? luaType.name
        : `${luaType.name}<${luaType.generics.map(format).join(", ")}>`;
    case LuaTypeKind.Array:
      return `${format(luaType.arrayType)}[]`;
    case LuaTypeKind.Union:
      return `(${luaType.types.map(format).join("|")})`;
    case LuaTypeKind.Dictionary:
      return `{ [${format(luaType.keyType)}]: ${format(luaType.valueType)} }`;
    case LuaTypeKind.Function:
      return `fun(${luaType.parameters
        .map(([name, type]) => `${name}: ${format(type)}`)
        .join(", ")}): ${format(luaType.returnType)}`;
    case LuaTypeKind.Tuple:
      return `[${luaType.elementTypes.map(format).join(", ")}]`;
    default:
      throw new Error(`Unknown Lua type kind: ${(luaType as any).kind}`);
  }
}

export const formatType = format;
