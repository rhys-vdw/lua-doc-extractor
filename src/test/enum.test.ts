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
    \t---@type 5
    \tFIVE = nil,

    \t---@type 6
    \tSIX = nil,

    \t---@type 7
    \tSEVEN = nil,

    \t---@type 8
    \tEIGHT = nil
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
    \t---@type 6
    \t---
    \t---This is six.
    \tSIX = nil,

    \t---@type 7 Seven.
    \t---
    \t---These are seven and eight.
    \tSEVEN = nil,

    \t---@type 8 Eight.
    \t---
    \t---These are seven and eight.
    \tEIGHT = nil
    }
  `
);
