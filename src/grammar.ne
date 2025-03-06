# see also: https://github.com/antlr/grammars-v4

@preprocessor typescript

@{%

import { docLexer } from "./docLexer";
import { createAttribute as attr } from "./attribute";
import { createType as type, unionTypes as union } from "./luaType";

function log<T>(d: T, ...rest: any[]): T {
  console.log(d, ...rest);
  return d;
}

%}

@lexer docLexer

doc ->
    lines attribute:* {% ([description = "", attributes]) => ({ description, attributes, lua: [] })%}
  | attribute:* {% ([attributes]) => ({ description: "", attributes, lua: [] }) %}

attribute ->
    %functionAttr __ identifier lines {% ([,, name, description]) =>
      attr("function", { name, description }, {})
    %}
  | %paramAttr __ identifier lines {% ([,, name, description]) =>
      attr("param", { name, description }, {})
    %}
  | %tableAttr __ identifier lines {% ([,, name, description]) =>
      attr("table", { name, description }, { isLocal: false })
    %}
  | %enumAttr __ identifier lines {% ([,, name, description]) =>
      attr("enum", { name, description }, {})
    %}
  | %classAttr __ identifier lines {% ([,, name, description]) =>
      attr("class", { name, description }, {})
    %}
  | %fieldAttr __ identifier __ type lines {% ([,, name,, type, description]) =>
      attr("field", { name, typeName: type.name, description }, { type })
    %}
  | %globalAttr __ identifier __ type lines {% ([,, name,, type, description]) =>
      attr("global", { name, typeName: type.name, description }, { type })
    %}
  | %attribute lines {% ([a, description]) =>
      attr(a.value, { description }, {})
    %}

lines -> (line %newline):+ {% d => d[0].flat().join("") %}

line -> (%word | __ | %literal | identifier | %syntax):* {% d => d.flat().join("") %}

type ->
    literal {% id %}
  | namedType {% id %}
  | unionType {% id %}
  | type "?" {% ([t]) => ({ ...t, optional: true }) %}
  | "(" type ")" {% ([, t, ]) => ({ ...t, parens: true }) %}

literal -> %literal {% ([d]) =>
  type("literal", { value: d.value })
%}

namedType -> identifier generics:? {% ([name, g, ]) =>
  type("named", { name: name, generics: g ?? [] })
%}

identifier -> %identifier {% ([d]) => d.value %}

generics -> "<" typeList ">" {% ([, types, ]) => log(types, "types") %}

unionType ->
    type _ "|" _ type {% (ts) => union(ts[0], ts.at(-1)) %}

typeList ->
    type
  | type _ "," _ typeList {% (ts) => [ts[0], ...ts.at(-1)] %}

_ -> %space:? {% ([d]) => d?.value %}
__ -> %space {% ([d]) => d.value %}