import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Generates table with fields",
  dedent`
  /***
   * My table.
   * @field foo integer This is foo.
   * @field bar string This is bar.
   * @table TheTable
   */
  `,
  dedent`
    ---My table.
    TheTable = {
    \t---@type integer This is foo.
    \tfoo = nil,

    \t---@type string This is bar.
    \tbar = nil
    }
  `
);

testInput(
  "Generates empty table",
  dedent`
  /***
   * My empty table.
   * @table Empty
   */
  `,
  dedent`
    ---My empty table.
    Empty = {}
  `
);

testInput(
  "Supports multi-line field description.",
  dedent`
  /***
   * My table.
   * @field foo integer
   * This is foo.
   *
   * @field bar string
   * This is bar.
   * Bar is good.
   *
   * @table TheTable
   */
  `,
  dedent`
    ---My table.
    TheTable = {
    \t---@type integer This is foo.
    \tfoo = nil,

    \t---@type string This is bar.
    \t---Bar is good.
    \tbar = nil
    }
  `
);

testInput(
  "Correctly wraps keywords.",
  dedent`
  /***
   * Cool table.
   * @field value integer The value.
   * @field repeat boolean Should this repeat?
   * @table CoolTable
   */
  `,
  dedent`
    ---Cool table.
    CoolTable = {
    \t---@type integer The value.
    \tvalue = nil,

    \t---@type boolean Should this repeat?
    \t["repeat"] = nil
    }
  `
);
