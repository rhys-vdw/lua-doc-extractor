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
    %tableAttr %space %word lines {% ([attr, _s, name, description]) =>
      create("table", description, { name: name.value, isLocal: false, description })
    %}
  | %enumAttr %space %word lines {% ([attr, _s, name, description]) =>
      create("enum", description, { name: name.value })
    %}
  | %classAttr %space %word lines {% ([attr, _s, name, description]) =>
      create("class", description, { name: name.value })
    %}
  | %fieldAttr %space %word lines {% ([attr, _s, name, description]) =>
      create("field", description, { name: name.value, description })
    %}
  | %globalAttr %space %word lines {% ([attr, _s, name, description]) =>
      create("global", description, { name: name.value, description })
    %}
  | %attribute lines {% ([attr, description]) =>
      create(attr.value, description)
    %}

lines -> (line %newline):+ {% (d) => d.flat(2).join("") %}

line -> (
  code {% id %}
  | %word {% id %}
  | %space {% id %}
):* {% d => d.flat(2).join("") %}

code ->
    %codeBlockStart %code %codeBlockEnd
  | %inlineCodeStart %code %inlineCodeEnd

# There has to be a better way.
text -> (
  code {% id %}
  | %word {% id %}
  | %space {% id %}
  | %newline {% id %}
):* {% d => d.flat(2) %}