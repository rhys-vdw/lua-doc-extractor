import dedent from "dedent-js";
import test from "tape";
import { getRawComments, RawComment } from "../parser";

function testGetRawComments(
  name: string,
  input: string,
  expected: readonly RawComment[]
) {
  test(name, (t) => {
    const actual = getRawComments(input, {
      commentStart: "/***",
      commentEnd: "*/",
    });
    t.deepEqual(actual, expected);
    t.end();
  });
}

testGetRawComments(
  "getRawComments parses single line",
  dedent`
    /*** @global foo Foo This is my cool global. */
  `,
  [
    {
      lines: [" @global foo Foo This is my cool global. "],
      start: { lineNumber: 1, columnNumber: 1 },
      end: { lineNumber: 1, columnNumber: 47 },
    },
  ]
);

testGetRawComments(
  "getRawComments parses multiline",
  dedent`


    /***
     * Some description
     * @deprecated
     * @global foo Foo This is my cool global. */
  `,
  [
    {
      lines: [
        "",
        " * Some description",
        " * @deprecated",
        " * @global foo Foo This is my cool global. ",
      ],
      start: { lineNumber: 3, columnNumber: 1 },
      end: { lineNumber: 6, columnNumber: 45 },
    },
  ]
);

testGetRawComments(
  "getRawComments parses multiple comments",
  dedent`
    /*** @global foo Foo This is my cool global. */

    /***
     * Some description
     * @deprecated
     * @global foo Foo This is my cool global. */
  `,
  [
    {
      lines: [" @global foo Foo This is my cool global. "],
      start: { lineNumber: 1, columnNumber: 1 },
      end: { lineNumber: 1, columnNumber: 47 },
    },
    {
      lines: [
        "",
        " * Some description",
        " * @deprecated",
        " * @global foo Foo This is my cool global. ",
      ],
      start: { lineNumber: 3, columnNumber: 1 },
      end: { lineNumber: 6, columnNumber: 45 },
    },
  ]
);

testGetRawComments(
  "getRawComments parses two in one line",
  " /*** A comment. */ /*** Another! */",
  [
    {
      lines: [" A comment. "],
      start: { lineNumber: 1, columnNumber: 2 },
      end: { lineNumber: 1, columnNumber: 19 },
    },
    {
      lines: [" Another! "],
      start: { lineNumber: 1, columnNumber: 21 },
      end: { lineNumber: 1, columnNumber: 36 },
    },
  ]
);
