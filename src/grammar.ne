# see also: https://github.com/antlr/grammars-v4

@preprocessor typescript

@{%
import { docLexer } from "./docLexer";
%}

@lexer docLexer

doc ->
    text attribute:* {% ([description, attributes]) => ({ description, attributes }) %}
  | attribute:* {% ([attributes]) => ({ description: [], attributes }) %}

attribute ->
    %attribute text {% ([attr, description = []]) => ({ type: attr.value, description }) %}

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