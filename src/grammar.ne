# see also: https://github.com/antlr/grammars-v4

@preprocessor typescript

@{%
import { docLexer } from "./docLexer"

%}

@lexer docLexer

doc -> text:? attribute:*

attribute -> %attribute text

code ->
    %codeBlockStart %code %codeBlockEnd
  | %inlineCodeStart %code %inlineCodeEnd

text -> (
  code
  | %word
  | %space
  | %newline
):*