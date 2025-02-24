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
    %field %space %word %space %word lines {% ([attr, _s, name, _, type, description]) =>
      ({ type: attr.value, field: { name: name.value, type: type.value }, description })
    %}
  | %global %space %word %space %word lines {% ([attr, _s, name, _, type, description]) =>
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