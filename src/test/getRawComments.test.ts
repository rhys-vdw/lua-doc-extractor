import dedent from "dedent-js";
import test from "tape";
import { getRawComments, RawComment } from "../getRawComments";

function testGetRawComments(
  name: string,
  input: string,
  expected: readonly RawComment[],
  only: boolean = false
) {
  const testFn = only ? test.only : test;
  testFn(name, (t) => {
    const actual = getRawComments(input);
    t.deepEqual(actual, expected);
    t.end();

    if (only) {
      console.log("---EXPECTED---");
      console.log(expected);
      console.log("---ACTUAL---");
      console.log(actual);
    }
  });
}

testGetRawComments(
  "getRawComments parses single line",
  dedent`
    /*** @global foo Foo This is my cool global. */
  `,
  [
    {
      text: "@global foo Foo This is my cool global.",
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
      text: dedent`

        Some description
        @deprecated
        @global foo Foo This is my cool global.
      `,
      start: { lineNumber: 3, columnNumber: 1 },
      end: { lineNumber: 6, columnNumber: 45 },
    },
  ]
);

testGetRawComments(
  "getRawComments handles text on first line",
  dedent`
    /*** @function MyCoolFunc
     * This is cool!
     */
  `,
  [
    {
      text: dedent`
        @function MyCoolFunc
        This is cool!
      `,
      start: { lineNumber: 1, columnNumber: 1 },
      end: { lineNumber: 3, columnNumber: 3 },
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
      text: "@global foo Foo This is my cool global.",
      start: { lineNumber: 1, columnNumber: 1 },
      end: { lineNumber: 1, columnNumber: 47 },
    },
    {
      text: dedent`

        Some description
        @deprecated
        @global foo Foo This is my cool global.
      `,
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
      text: "A comment.",
      start: { lineNumber: 1, columnNumber: 2 },
      end: { lineNumber: 1, columnNumber: 19 },
    },
    {
      text: "Another!",
      start: { lineNumber: 1, columnNumber: 21 },
      end: { lineNumber: 1, columnNumber: 36 },
    },
  ]
);
