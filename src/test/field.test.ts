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
