import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Generates global",
  dedent`
    /***
     * @global foo Foo This is my cool global.
     */
  `,
  dedent`
    ---This is my cool global.
    ---
    ---@type Foo
    foo = nil
  `
);

testInput(
  "Generates global multiline description",
  dedent`
    /***
     * @global foo Foo
     * This is my cool deprecated global.
     * @deprecated
     */
  `,
  dedent`
    ---@deprecated
    ---This is my cool deprecated global.
    ---
    ---@type Foo
    foo = nil
  `
);

const types = [
  "integer",
  "string?",
  "(string?|number)?",
  "table<string, boolean>",
  "(integer|table<string, boolean>|Foo)?",
  "{}",
  "{ x: integer, y: integer }",
  "{ x: number?, y: A|B }",
  "A|B",
  "integer|string",
  "{ [string]: integer }",
  "{ [(string|table<string, string>?)]: integer }",
  "fun()",
  "fun(x: integer, z: string): string",
  "fun(integer: string): (string|number?)",
  "fun(y: string): string|number?",
  "[number, integer]",
  "[table<string>?|integer, nil, true]",
  "integer[]",
  "string?[]",
  "(string?|number)[]",
];

types.forEach((type) => {
  testInput(
    `Generates global with type ${type}`,
    dedent`
    /***
     * @field Foo.bar ${type} The description.
     */
    `,
    dedent`
      ---The description.
      ---
      ---@type ${type}
      Foo.bar = nil
    `
  );
});
