declare module "parse-comments" {
  export default class Comments {
    parse(input: string): Comment[];
  }

  export interface CodeRange {
    start: { line: number; column: number };
    end: { line: number; column: number };
  }

  export interface Tag {
    title: string;
    name: string;
    description: string;
    type: { type: string; name: string };
  }

  export interface Comment {
    type: string;
    value: string;
    range: [number, number];
    loc: CodeRange;
    codeStart: number;
    raw: string;
    code: {
      context: {
        type: string;
        ctor: string;
        name: string;
        extends: undefined;
        string: string;
      };
      value: string;
      range: [number, number];
      loc: CodeRange;
    };
    description: string;
    footer: string;
    examples: [];
    tags: Tag[];
    inlineTags: string[];
  }
}
