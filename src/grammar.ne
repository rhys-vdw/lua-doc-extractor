# see also: https://github.com/antlr/grammars-v4

@preprocessor typescript

@{%

import { docLexer } from "./docLexer";
import { createAttribute as create } from "./attribute";

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
    %functionAttr __ identifier lines {% ([attr,, name, description]) =>
      create("function", { name, description }, {})
    %}
  | %paramAttr __ identifier lines {% ([attr,, name, description]) =>
      create("param", { name, description }, {})
    %}
  | %tableAttr __ identifier lines {% ([attr,, name, description]) =>
      create("table", { name, description }, { isLocal: false })
    %}
  | %enumAttr __ identifier lines {% ([attr,, name, description]) =>
      create("enum", { name, description }, {})
    %}
  | %classAttr __ identifier lines {% ([attr,, name, description]) =>
      create("class", { name, description }, {})
    %}
  | %fieldAttr __ identifier __ type lines {% ([attr,, name,, type, description]) =>
      create("field", { name, typeName: type.name, description }, { type })
    %}
  | %globalAttr __ identifier __ type lines {% ([attr,, name,, type, description]) =>
      create("global", { name, typeName: type.name, description }, { type })
    %}
  | %attribute lines {% ([attr, description]) =>
      create(attr.value, { description }, {})
    %}

lines -> (line %newline):+ {% d => d[0].flat().join("") %}

line -> (%word | __ | %literal | identifier | %syntax):* {% d => d.flat().join("") %}

type ->
    literal {% id %}
  | unionType {% id %}
  | namedType {% id %}
  | type "?" {% ([t]) => ({ ...t, optional: true }) %}

literal -> %literal {% ([d]) =>
  ({ kind: "literal", value: d.value })
%}

namedType -> identifier generics:? {% ([name,, g, ]) =>
  ({ kind: "named", name: name, generics: g ?? [] })
%}

identifier -> %identifier {% ([d]) => d.value %}

generics -> "<" typeList ">" {% ([, types, ]) => types %}

unionType ->
    type _ ("|" _ type):+ {% ([t,, ts]) => ({
      kind: "union",
      types: [t, ...ts.flatMap((e: any) => e[2])],
      parens: false
    }) %}
  | "(" unionType ")" {% ([, t, ]) => ({ ...t, parens: true }) %}

typeList ->
    type
  | type _ "," _ typeList {% (ts) => [ts[0], ...ts.at(-1)] %}

_ -> %space:? {% ([d]) => d?.value %}
__ -> %space {% ([d]) => d.value %}