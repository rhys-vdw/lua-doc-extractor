# see also: https://github.com/antlr/grammars-v4

@preprocessor typescript

@{%

import { docLexer } from "./docLexer";
import { createAttribute as attr } from "./attribute";
import { createType as type, unionTypes as union } from "./luaType";

function log<T>(d: T, name?: string): T {
  console.log("--------- start:" + name);
  console.log(d);
  console.log("--------- end:" + name);
  return d;
}

%}

@lexer docLexer

# -- Document --

doc ->
    lines attribute:* {% ([description, attributes]) => ({ description, attributes, lua: [] })%}

# -- Attribute --

attribute ->
    functionAttr {% id %}
  | %paramAttr __ identifier lines {% ([,, name, description]) =>
      attr("param", { name, description })
    %}
  | %tableAttr __ identifier lines {% ([,, name, description]) =>
      attr("table", { isLocal: false, name, description })
    %}
  | %enumAttr __ identifier lines {% ([,, name, description]) =>
      attr("enum", { name, description })
    %}
  | %classAttr __ namedType description {% ([,, type, description]) =>
      attr("class", { type, description })
    %}
  | fieldAttr {% id %}
  | %attribute lines {% ([a, description]) =>
      attr(a.value, { description })
    %}

fieldAttr -> (%fieldAttr|%globalAttr) __ (identifier "."):* identifier __ unionType unionDesc {%
  ([[a],, ts = [], name,, type, description]) => {
    const tables = ts.map(([t, _]: any) => t);
    return attr(a.value, { tables, name, type, description });
  }
%}

functionAttr -> %functionAttr __ (identifier "."):* identifier description {%
  ([,, ts = [], name, description]) => {
    const tables = ts.map(([t, _]: any) => t);
    return attr("function", { tables, name, description });
  }
%}

description ->
    __ lines {% ([, d]) => d %}
  | %newline lines {% ([, d]) => d %}

unionDesc ->
    __ anyWordButPipe lines {% ([, word, ls]) => [word, ls].join('') %}
  | %newline lines {% ([, ls]) => ls %}

# -- Text --

lines -> line:* {% d => d[0].flat().join("") %}

line -> anyWord:* %newline {% ([l, nl]) => [...l.flat(), nl].join("") %}

anyWordButPipe -> (%word | __ | %literal | identifier | %syntax) {% id %}
anyWord -> (anyWordButPipe | %pipe) {% id %}

# -- Type ---

singleType ->
    literal {% id %}
  | namedType {% id %}
  | arrayType {% id %}
  | dictionaryType {% id %}
  | tableType {% id %}
  | tupleType {% id %}
  | functionType {% id %}
  | singleType "?" {% ([t]) => ({ ...t, optional: true }) %}
  | "(" unionType ")" {% ([, t, ]) => ({ ...t, parens: true }) %}

literal -> %literal {% ([d]) =>
  type("literal", { value: d.value })
%}

namedType -> identifier generics:? {% ([name, g, ]) =>
  type("named", { name: name, generics: g ?? [] })
%}

identifier -> %identifier {% ([d]) => d.value %}

generics -> "<" typeList ">" {% ([, types, ]) => types %}

unionType ->
    singleType {% id %}
  | singleType _ "|" _ unionType {% (ts) => union(ts[0], ts.at(-1)) %}

typeList ->
    unionType
  | unionType _ "," _ typeList {% (ts) => [ts[0], ...ts.at(-1)] %}

arrayType ->
    singleType "[" _ "]" {%
      (ds) => type("array", { arrayType: ds[0] })
    %}

dictionaryType ->
    "{" _ "[" _ unionType _ "]" _ ":" _ unionType _ "}" {%
      (ds) => type("dictionary", { keyType: ds.at(4), valueType: ds.at(-3) })
    %}

tableType -> "{" _ (parameters _):? "}" {% (ds) => type("table", { fields: ds[2]?.at(0) ?? [] }) %}

tupleType -> "[" _ typeList _ "]" {%
    (ts) => type("tuple", { types: ts[2] })
  %}

# NOTE: I'm not sure how LLS/emmy support this, but there is ambiguity in this:

#  fun(): number|string
#
# i.e. is it `(fun(): number)|string or fun(): (number|string)`?
#
# Defining the return type as singleType eliminates the ambiguity, but still
# parses the input and outputs it for LLS to interpret as it wishes.
functionType ->
  "fun" "(" parameters:? ")" (_ ":" _ singleType):? {% ([,, p,, r]) => {
    return type("function", { parameters: p ?? [], returnType: r?.at(-1) ?? null })
  }%}

parameters ->
    parameter
  | parameter _ "," _ parameters {% (ts) => [ts[0], ...ts.at(-1)] %}


parameter ->
  identifier _ ":" _ unionType {% (ds) => [ds[0], ds.at(-1)] %}

# -- Whitespace --

_ -> %space:? {% ([d]) => d?.value %}
__ -> %space {% ([d]) => d.value %}