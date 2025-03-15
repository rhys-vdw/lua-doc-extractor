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
  | %classAttr __ identifier description {% ([,, name, description]) =>
      attr("class", { name, description })
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
  | singleType "?" {% ([t]) => ({ ...t, optional: true }) %}
  | "(" unionType ")" {% ([, t, ]) => ({ ...t, parens: true }) %}

literal -> %literal {% ([d]) =>
  type("literal", { value: d.value })
%}

namedType -> identifier generics:? {% ([name, g, ]) =>
  type("named", { name: name, generics: g ?? [] })
%}

identifier -> %identifier {% ([d]) => d.value %}

generics -> "<" typeList ">" {% ([, types, ]) => log(types, "types") %}

unionType ->
    singleType {% id %}
  | singleType _ "|" _ unionType {% (ts) => union(ts[0], ts.at(-1)) %}

typeList ->
    unionType
  | unionType _ "," _ typeList {% (ts) => [ts[0], ...ts.at(-1)] %}

# -- Whitespace --

_ -> %space:? {% ([d]) => d?.value %}
__ -> %space {% ([d]) => d.value %}