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

interface BaseLuaType {
  readonly kind: LuaTypeKind;
  readonly optional?: boolean;
}

/**
 * A literal number, string, boolean or nil.
 */
export interface LuaLiteralType extends BaseLuaType {
  readonly kind: LuaTypeKind.Literal;
  readonly value: string;
}

/**
 * Any named class, table, enum etc, with or without generics. Includes basics
 * such as `table`, `string` etc.
 */
export interface LuaNamedType extends BaseLuaType {
  readonly kind: LuaTypeKind.Named;
  readonly name: string;
  readonly generics: LuaType[];
}

/**
 * Union of multiple types.
 */
export interface LuaUnionType extends BaseLuaType {
  readonly kind: LuaTypeKind.Union;
  readonly types: LuaType[];
  readonly parens?: boolean;
}

/**
 * Array type.
 */
export interface LuaArrayType extends BaseLuaType {
  readonly kind: LuaTypeKind.Array;
  readonly arrayType: LuaType;
}

/**
 * Tuple type.
 */
export interface LuaTupleType extends BaseLuaType {
  readonly kind: LuaTypeKind.Tuple;
  readonly elementTypes: readonly LuaType[];
}

/**
 * Table with a specific key and value type.
 */
export interface LuaDictionaryType extends BaseLuaType {
  readonly kind: LuaTypeKind.Dictionary;
  readonly keyType: LuaType;
  readonly valueType: LuaType;
}

/**
 * Function type.
 */
export interface LuaFunctionType extends BaseLuaType {
  readonly kind: LuaTypeKind.Function;
  readonly parameters: readonly [string, LuaType][];
  readonly returnType: LuaType;
}

export function formatType(luaType: LuaType): string {
  const f = formatTypeWithoutOptional(luaType);
  return luaType.optional ? `${f}?` : f;
}

function formatTypeWithoutOptional(luaType: LuaType): string {
  const f = formatType;
  const t = luaType;

  console.log("about to format type", t);
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
      const u = t.types.map(f).join("|");
      return t.parens ? `(${u})` : u;
    case LuaTypeKind.Dictionary:
      return `{ [${f(t.keyType)}]: ${f(t.valueType)} }`;
    case LuaTypeKind.Function:
      return `fun(${t.parameters
        .map(([name, type]) => `${name}: ${f(type)}`)
        .join(", ")}): ${f(t.returnType)}`;
    case LuaTypeKind.Tuple:
      return `[${t.elementTypes.map(f).join(", ")}]`;
    default:
      throw new Error(`Unknown Lua type kind: ${(t as LuaType).kind}`);
  }
}
