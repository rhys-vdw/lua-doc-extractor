import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Parses /*** comments only.",
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
    \t---@type 5
    \tFIVE = nil,

    \t---@type 6
    \tSIX = nil
    }
  `
);
