export type LuaType =
  | LuaLiteralType
  | LuaNamedType
  | LuaArrayType
  | LuaUnionType
  | LuaTupleType
  | LuaDictionaryType
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
  readonly name: string;
  readonly generics: LuaType[];
}

/**
 * Union of multiple types.
 */
export interface LuaUnionType extends BaseLuaType {
  readonly kind: "union";
  readonly types: LuaType[];
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
  readonly elementTypes: readonly LuaType[];
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
 * Function type.
 */
export interface LuaFunctionType extends BaseLuaType {
  readonly kind: "function";
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

  // console.log("about to format type", t);
  switch (t.kind) {
    case "literal":
      return t.value;
    case "named":
      return t.generics.length === 0
        ? t.name
        : `${t.name}<${t.generics.map(f).join(", ")}>`;
    case "array":
      return `${f(t.arrayType)}[]`;
    case "union":
      const u = t.types.map(f).join("|");
      return t.parens ? `(${u})` : u;
    case "dictionary":
      return `{ [${f(t.keyType)}]: ${f(t.valueType)} }`;
    case "function":
      return `fun(${t.parameters
        .map(([name, type]) => `${name}: ${f(type)}`)
        .join(", ")}): ${f(t.returnType)}`;
    case "tuple":
      return `[${t.elementTypes.map(f).join(", ")}]`;
    default:
      throw new Error(`Unknown Lua type kind: ${(t as LuaType).kind}`);
  }
}

export function unionTypes(type: LuaType, ...types: LuaType[]): LuaType {
  // console.log("about to union types", type, types);
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
