# see also: https://github.com/antlr/grammars-v4

@preprocessor typescript

@{%
import { docLexer } from "./docLexer";
import { Doc, Attribute } from "./doc";

%}

@lexer docLexer

doc -> text:? attribute:* {% ([description, attributes]) =>
  ({ description, attributes } as Doc)
%}

attribute -> %attribute %space:? text:? {% ([{ value: type }, _, description]) =>
  ({ type, description: description ?? [] } as Attribute)
%}

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