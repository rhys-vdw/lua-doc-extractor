import dedent from "dedent-js";
import test from "tape";
import { getComments, Comment } from "../comment";

function testGetComments(
  name: string,
  input: string,
  expected: readonly Comment[],
  only: boolean = false
) {
  const testFn = only ? test.only : test;
  testFn(name, (t) => {
    const actual = getComments(input);
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

testGetComments(
  "getComments parses single line",
  dedent`
    /*** @global foo Foo This is my cool global. */
  `,
  [
    {
      text: "@global foo Foo This is my cool global.",
      start: { line: 1, col: 1 },
      end: { line: 1, col: 47 },
    },
  ]
);

testGetComments(
  "getComments parses multiline",
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
      start: { line: 3, col: 1 },
      end: { line: 6, col: 45 },
    },
  ]
);

testGetComments(
  "getComments handles text on first line",
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
      start: { line: 1, col: 1 },
      end: { line: 3, col: 3 },
    },
  ]
);
testGetComments(
  "getComments parses multiple comments",
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
      start: { line: 1, col: 1 },
      end: { line: 1, col: 47 },
    },
    {
      text: dedent`

        Some description
        @deprecated
        @global foo Foo This is my cool global.
      `,
      start: { line: 3, col: 1 },
      end: { line: 6, col: 45 },
    },
  ]
);

testGetComments(
  "getComments parses two in one line",
  " /*** A comment. */ /*** Another! */",
  [
    {
      text: "A comment.",
      start: { line: 1, col: 2 },
      end: { line: 1, col: 19 },
    },
    {
      text: "Another!",
      start: { line: 1, col: 21 },
      end: { line: 1, col: 36 },
    },
  ]
);
