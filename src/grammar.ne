# see also: https://github.com/antlr/grammars-v4

@preprocessor typescript

@{%
import { docLexer } from "./docLexer";

import { Token } from "moo";

export interface Doc {
  description: Token[]
  attributes: Attribute[]
}

export interface Attribute {
  type: Token,
  description: Token[]
}

%}

@lexer docLexer

doc -> text:? attribute:* {% ([description, attributes]) => ({ description, attributes }) %}

attribute -> %attribute %space text {% ([type, _, description]) => ({ type, description }) %}

code ->
    %codeBlockStart %code %codeBlockEnd
  | %inlineCodeStart %code %inlineCodeEnd

text -> (
  code {% id %}
  | %word {% id %}
  | %space {% id %}
  | %newline {% id %}
):*