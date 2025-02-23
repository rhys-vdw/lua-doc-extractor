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
    \t---@type integer
    \t---This is foo.
    \tfoo = nil,

    \t---@type string
    \t---This is bar.
    \t---Bar is good.
    \tbar = nil
    }
  `
);
