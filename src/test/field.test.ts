import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Generates standalone field",
  dedent`
  /***
   * The description.
   * @field SomeTable.field integer
   */
  `,
  dedent`
    ---The description.
    ---@type integer
    SomeTable.field = nil
  `
);

testInput(
  "Generates standalone field with doc description",
  dedent`
    /***
     * Some description.
     *
     * @field foo number More.
     *
     * Some more.
     */
  `,
  dedent`
    ---Some description.
    ---@type number More.
    ---
    ---Some more.
    foo = nil
  `
);
