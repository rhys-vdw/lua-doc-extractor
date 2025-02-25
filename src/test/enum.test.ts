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
    \t---@type 5
    \tFIVE = nil,

    \t---@type 6
    \tSIX = nil
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
    \t---@type 5
    \tFIVE = nil
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
    \t---@type 5
    \tFIVE = nil,

    \t---@type 6
    \tSIX = nil
    }
  `
);
