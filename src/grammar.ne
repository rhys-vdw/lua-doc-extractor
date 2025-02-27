# see also: https://github.com/antlr/grammars-v4

@preprocessor typescript

@{%
import { docLexer } from "./docLexer";
import { createAttribute as create } from "./attribute";

%}

@lexer docLexer

doc ->
    lines attribute:* {% ([description = "", attributes]) => ({ description, attributes, lua: [] })%}
  | attribute:* {% ([attributes]) => ({ description: "", attributes, lua: [] }) %}

attribute ->
    %functionAttr %space %word lines {% ([attr, _s, name, description]) =>
      create("function", { name: name.value, description }, {})
    %}
  | %paramAttr %space %word lines {% ([attr, _s, name, description]) =>
      create("param", { name: name.value, description }, {})
    %}
  | %tableAttr %space %word lines {% ([attr, _s, name, description]) =>
      create("table", { name: name.value, description }, { isLocal: false })
    %}
  | %enumAttr %space %word lines {% ([attr, _s, name, description]) =>
      create("enum", { name: name.value, description }, {})
    %}
  | %classAttr %space %word lines {% ([attr, _s, name, description]) =>
      create("class", { name: name.value, description }, {})
    %}
  | %fieldAttr %space %word lines {% ([attr, _s, name, description]) =>
      create("field", { name: name.value, description }, {})
    %}
  | %globalAttr %space %word lines {% ([attr, _s, name, description]) =>
      create("global", { name: name.value, description }, {})
    %}
  | %attribute lines {% ([attr, description]) =>
      create(attr.value, { description }, {})
    %}

lines -> (line %newline):+ {% d => d[0].flat().join("") %}

line -> (%word | %space):* {% d => d.flat().join("") %}