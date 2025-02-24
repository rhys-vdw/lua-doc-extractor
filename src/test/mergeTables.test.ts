import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Merges tables",
  dedent`
    /***
     * Foo description.
     * @table Foo
     * @field foo integer This is foo.
     */

    /***
     * Additional.
     * @table Foo
     * @field bar string This is bar.
     */
  `,
  dedent`
    ---Foo description.
    ---
    ---Additional.
    Foo = {
    \t---@type integer This is foo.
    \tfoo = nil,

    \t---@type string This is bar.
    \tbar = nil
    }
  `
);

testInput(
  "Merge classes by using matching `@table`",
  dedent`
    /***
     * Foo description.
     * @class Foo First.
     * @field foo integer This is foo.
     */

    /***
     * Additional.
     * @table Foo Second.
     * @field bar string This is bar.
     */
  `,
  dedent`
    ---Foo description.
    ---
    ---Additional.
    ---
    ---Second.
    ---
    ---@class Foo First.
    local Foo = {
    \t---@type integer This is foo.
    \tfoo = nil,

    \t---@type string This is bar.
    \tbar = nil
    }
  `
);

testInput(
  "Merge enums using matching `@table`",
  dedent`
    /***
     * Foo description.
     * @enum Foo First.
     * @field FIVE 5
     */

    /***
     * Additional.
     * @table Foo Second.
     * @field SIX 6
     */
  `,
  dedent`
    ---Foo description.
    ---
    ---Additional.
    ---
    ---Second.
    ---
    ---@enum Foo First.
    Foo = {
    \t---@type 5
    \tFIVE = nil,

    \t---@type 6
    \tSIX = nil
    }
  `
);
