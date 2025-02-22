import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Parses /*** comments only.",
  dedent`
    /***
     * @table Foo
     */

    /**
     * @table Bar
     */
  `,
  dedent`
    Foo = {}
  `
);

testInput(
  "Ignores extra asterisks after /***",
  dedent`
    /****************
     * @table Foo
     */
  `,
  dedent`
    Foo = {}
  `
);

testInput(
  "Single attribute followed by newline and text",
  dedent`
    /***
     * @usage
     * another line
     */
  `,
  dedent`
    ---@usage
    ---another line
  `
);
