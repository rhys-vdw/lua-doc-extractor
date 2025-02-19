# see also: https://github.com/antlr/grammars-v4

@preprocessor typescript

@{%
import { docLexer } from "./docLexer";
import { Doc, Attribute } from "./doc";

%}

@lexer docLexer

doc ->
    text attribute:* {% ([description, attributes]) => ({ description, attributes } as Doc) %}
  | attribute:* {% ([attributes]) => ({ description: [], attributes } as Doc) %}

attribute ->
    %attribute %space text {% ([attr, _, description]) => ({ type: attr.value, description } as Attribute) %}
  | %attribute             {% ([attr]) => ({ type: attr.value, description: [] } as Attribute) %}

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