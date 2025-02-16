import dedent from "dedent-js";
import { testMembers } from "./utility/harness";

testMembers(
  "Generates global",
  dedent`
    /***
     * @global foo Foo This is my cool global.
     */
  `,
  dedent`
    ---@type Foo This is my cool global.
    foo = nil
  `
);

testMembers(
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
    ---@type Foo
    ---This is my cool deprecated global.
    foo = nil
  `
);

testMembers(
  "Generates global with complex type",
  dedent`
    /***
     * This is the description.
     * @global foo (integer | table<string, boolean> | Foo)?
     */
  `,
  dedent`
    ---This is the description.
    ---@type (integer | table<string, boolean> | Foo)?
    foo = nil
  `
);
