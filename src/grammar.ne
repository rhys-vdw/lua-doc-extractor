# see also: https://github.com/antlr/grammars-v4

@preprocessor typescript

@{%

import { docLexer } from "./docLexer";
import { createAttribute as create } from "./attribute";

function log<T>(d: T): T {
  console.log(`'${d}'`);
  return d;
}

%}

@lexer docLexer

doc ->
    lines attribute:* {% ([description = "", attributes]) => ({ description, attributes, lua: [] })%}
  | attribute:* {% ([attributes]) => ({ description: "", attributes, lua: [] }) %}

attribute ->
    %functionAttr __ %word lines {% ([attr,, name, description]) =>
      create("function", { name: name.value, description }, {})
    %}
  | %paramAttr __ %word lines {% ([attr,, name, description]) =>
      create("param", { name: name.value, description }, {})
    %}
  | %tableAttr __ %word lines {% ([attr,, name, description]) =>
      create("table", { name: name.value, description }, { isLocal: false })
    %}
  | %enumAttr __ %word lines {% ([attr,, name, description]) =>
      create("enum", { name: name.value, description }, {})
    %}
  | %classAttr __ %word lines {% ([attr,, name, description]) =>
      create("class", { name: name.value, description }, {})
    %}
  | %fieldAttr __ %word __ type lines {% ([attr,, name,, type, description]) =>
      create("field", { name: name.value, typeName: type.name, description }, { type })
    %}
  | %globalAttr __ %word __ type lines {% ([attr,, name,, type, description]) =>
      create("global", { name: name.value, typeName: type.name, description }, { type })
    %}
  | %attribute lines {% ([attr, description]) =>
      create(attr.value, { description }, {})
    %}

lines -> (line %newline):+ {% d => d[0].flat().join("") %}

line -> (%word | __ | %literal):* {% d => d.flat().join("") %}

type ->
    %word    {% ([d]) => ({ kind: "type", name: d.value, generics: [] }) %}
  | %literal {% ([d]) => ({ kind: "literal", value: d.value }) %}

_ -> %space:? {% ([d]) => d.value %}
__ -> %space {% ([d]) => d.value %}