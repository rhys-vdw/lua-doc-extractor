declare module "comment-parser" {
  interface Tag {
    tag: string;
    name: string;
    type?: string;
    optional?: boolean;
    default?: string;
    description: string;
    problems: any[];
    source: TagSource[];
  }

  interface ParsedComment {
    description: string;
    tags: Tag[];
    source: string[];
  }

  interface TagSource {
    /** source line number */
    number: number;
    /** source line string */
    source: string;
    /** source line tokens */
    tokens: {
      /** indentation */
      start: string;
      /** Delimiter. Mid lines may have no delimiters */
      delimiter: "/**" | "*/" | "*" | "";
      /** space between delimiter and tag */
      postDelimiter: string;
      /** tag starting with "@" */
      tag: string;
      /** space between tag and type */
      postTag: string;
      /** name with no whitespaces or "multiple words" wrapped into quotes. May occure in [name] and [name=default] forms */
      name: string;
      /** space between name and type */
      postName: string;
      /** type is has to be {wrapped} into curlies otherwise will be omitted */
      type: string;
      /** space between type and description */
      postType: string;
      /** description is basicaly rest of the line */
      description: string;
      /** closing marker if present */
      end: "*/" | "";
    };
  }

  export function parse(source: string): ParsedComment[];
}
