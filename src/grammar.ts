// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }

var appendItem = (a, b) => (d) => d[a].concat([d[b]]);
var appendItemChar = (a, b) => (d) => d[a].concat(d[b]);
var empty = (d) => [];
var emptyStr = (d) => "";

interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: undefined,
  ParserRules: [
    {"name": "file", "symbols": ["header", "newline", "rows"], "postprocess": function (d) { return { header: d[0], rows: d[2] }; }},
    {"name": "header", "symbols": ["row"], "postprocess": id},
    {"name": "rows", "symbols": ["row"]},
    {"name": "rows", "symbols": ["rows", "newline", "row"], "postprocess": appendItem(0,2)},
    {"name": "row", "symbols": ["field"]},
    {"name": "row", "symbols": ["row", {"literal":","}, "field"], "postprocess": appendItem(0,2)},
    {"name": "field", "symbols": ["unquoted_field"], "postprocess": id},
    {"name": "field", "symbols": [{"literal":"\""}, "quoted_field", {"literal":"\""}], "postprocess": function (d) { return d[1]; }},
    {"name": "quoted_field", "symbols": [], "postprocess": emptyStr},
    {"name": "quoted_field", "symbols": ["quoted_field", "quoted_field_char"], "postprocess": appendItemChar(0,1)},
    {"name": "quoted_field_char", "symbols": [/[^"]/], "postprocess": id},
    {"name": "quoted_field_char", "symbols": [{"literal":"\""}, {"literal":"\""}], "postprocess": function (d) { return "\""; }},
    {"name": "unquoted_field", "symbols": [], "postprocess": emptyStr},
    {"name": "unquoted_field", "symbols": ["unquoted_field", "char"], "postprocess": appendItemChar(0,1)},
    {"name": "char", "symbols": [/[^\n\r",]/], "postprocess": id},
    {"name": "newline", "symbols": [{"literal":"\r"}, {"literal":"\n"}], "postprocess": empty},
    {"name": "newline", "symbols": [{"literal":"\r"}]},
    {"name": "newline", "symbols": [{"literal":"\n"}], "postprocess": empty}
  ],
  ParserStart: "file",
};

export default grammar;
