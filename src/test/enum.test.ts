import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Generates enum table",
  dedent`
    /***
     * @enum Numbers
     * @field FIVE 5
     * @field SIX 6
     */
  `,
  dedent`
    ---@enum Numbers
    Numbers = {
    \tFIVE = 5,

    \tSIX = 6
    }
  `
);

testInput(
  "Supports @enum description",
  dedent`
    /***
     * @enum Numbers These are numbers.
     * @field FIVE 5
     */
  `,
  dedent`
    ---@enum Numbers These are numbers.
    Numbers = {
    \tFIVE = 5
    }
  `
);

testInput(
  "Merges enums",
  dedent`
    /***
     * @enum Numbers
     * @field FIVE 5
     */

    /***
     * @enum Numbers These are numbers.
     * @field SIX 6
     */
  `,
  dedent`
    ---@enum Numbers These are numbers.
    Numbers = {
    \tFIVE = 5,

    \tSIX = 6
    }
  `
);

testInput(
  "Merges individual enum fields",
  dedent`
    /***
     * @enum Numbers
     * @field FIVE 5
     */

    /***
     * @field Numbers.SIX 6
     */

    /***
     * @field Numbers.SEVEN 7
     * @field Numbers.EIGHT 8
     */
  `,
  dedent`
    ---@enum Numbers
    Numbers = {
    \tFIVE = 5,

    \tSIX = 6,

    \tSEVEN = 7,

    \tEIGHT = 8
    }
  `
);

testInput(
  "Merges enum fields and handles doc description sensibly",
  dedent`
    /***
     * These are numbers.
     * @enum Numbers
     */

    /***
     * This is six.
     * @field Numbers.SIX 6
     */

    /***
     * These are seven and eight.
     * @field Numbers.SEVEN 7 Seven.
     * @field Numbers.EIGHT 8 Eight.
     */
  `,
  dedent`
    ---These are numbers.
    ---
    ---@enum Numbers
    Numbers = {
    \t---This is six.
    \tSIX = 6,

    \t---Seven.
    \t---
    \t---These are seven and eight.
    \tSEVEN = 7,

    \t---Eight.
    \t---
    \t---These are seven and eight.
    \tEIGHT = 8
    }
  `
);

testInput(
  "Merges enum fields and retains separate source links.",
  dedent`
    /***
     * These are numbers.
     * @enum Numbers
     */

    /***
     * @field Numbers.SIX 6 Six.
     */

    /***
     * @field Numbers.SEVEN 7 Seven.
     * @field Numbers.EIGHT 8 Eight.
     */
  `,
  dedent`
    ---These are numbers.
    ---
    ---\[<a href="https://foo.com/file.c#L1-L4" target="_blank">source</a>\]
    ---
    ---@enum Numbers
    Numbers = {
    \t---Six.
    \t---
    \t---\[<a href="https://foo.com/file.c#L6-L8" target="_blank">source</a>\]
    \tSIX = 6,

    \t---Seven.
    \t---
    \t---\[<a href="https://foo.com/file.c#L10-L13" target="_blank">source</a>\]
    \tSEVEN = 7,

    \t---Eight.
    \t---
    \t---\[<a href="https://foo.com/file.c#L10-L13" target="_blank">source</a>\]
    \tEIGHT = 8
    }
  `,
  undefined,
  { repoUrl: "https://foo.com", path: "file.c" }
);

testInput(
  "Handles negative literals",
  dedent`
    /***
     * @enum Foo
     * @field Z 0
     * @field A -1
     */

    /***
     * @field Foo.B -2
     */
  `,
  dedent`
    ---@enum Foo
    Foo = {
    \tZ = 0,

    \tA = -1,

    \tB = -2
    }
  `
);

testInput(
  "Handles nested enum",
  dedent`
    /***
     * @enum Foo.Bar
     * @field Z 0
     * @field A -1
     */

    /***
     * @field Foo.Bar.B -2
     */
  `,
  dedent`
    ---@enum Foo.Bar
    Foo.Bar = {
    \tZ = 0,

    \tA = -1,

    \tB = -2
    }
  `
);
