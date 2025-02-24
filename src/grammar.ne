# see also: https://github.com/antlr/grammars-v4

@preprocessor typescript

@{%
import { docLexer } from "./docLexer";

%}

@lexer docLexer

doc ->
    lines attribute:* {% ([description, attributes]) => ({ description, attributes, lua: [] }) %}
  | attribute:* {% ([attributes]) => ({ description: "", attributes, lua: [] }) %}

attribute ->
    %tableAttr %space %word lines {% ([attr, _s, name, _, type, description]) =>
      ({ type: attr.value, table: { name: name.value, isLocal: false }, description })
    %}
  | %enumAttr %space %word lines {% ([attr, _s, name, _, type, description]) =>
      ({ type: attr.value, enum: { name: name.value }, description })
    %}
  | %classAttr %space %word lines {% ([attr, _s, name, _, type, description]) =>
      ({ type: attr.value, class: { name: name.value }, description })
    %}
  | %fieldAttr %space %word %space %word lines {% ([attr, _s, name, _, type, description]) =>
      ({ type: attr.value, field: { name: name.value, type: type.value }, description })
    %}
  | %globalAttr %space %word %space %word lines {% ([attr, _s, name, _, type, description]) =>
      ({ type: attr.value, field: { name: name.value, type: type.value }, description })
    %}
  | %attribute lines {% ([attr, description]) =>
      ({ type: attr.value, description })
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