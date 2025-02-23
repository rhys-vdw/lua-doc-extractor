import dedent from "dedent-js";
import test from "tape";
import { getComments, Comment } from "../comment";
import { testInput, TestInputOptions } from "./utility/harness";

function testGetComments(
  name: string,
  input: string,
  expected: readonly Comment[],
  options: TestInputOptions = {}
) {
  testInput(name, input, undefined, expected, options);
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

testGetComments(
  "getComments parses 'no-break space'",
  dedent`
    /***
     * @param message this is non-breakingspace: ' '
     */
  `,
  [
    {
      text: dedent`
      @param message this is non-breakingspace: ' '
    `,
      start: { line: 1, col: 1 },
      end: { line: 3, col: 3 },
    },
  ]
);
