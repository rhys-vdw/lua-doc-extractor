import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Handles `@return?` gracefully",
  dedent`
    /***
     * @function LDoc
     * @param s string
     * @return? boolean
     */
  `,
  dedent`
    ---@param s string
    ---@return? boolean
    function LDoc(s) end
  `
);
