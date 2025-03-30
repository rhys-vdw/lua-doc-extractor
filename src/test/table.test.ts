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
    \t---This is foo.
    \t---
    \t---@type integer
    \tfoo = nil,

    \t---This is bar.
    \t---
    \t---@type string
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
    \t---This is foo.
    \t---
    \t---@type integer
    \tfoo = nil,

    \t---This is bar.
    \t---Bar is good.
    \t---
    \t---@type string
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
    \t---The value.
    \t---
    \t---@type integer
    \tvalue = nil,

    \t---Should this repeat?
    \t---
    \t---@type boolean
    \t["repeat"] = nil
    }
  `
);

testInput(
  "Supports nested table",
  dedent`
  /*** @table Spring.MoveCtrl */
  `,
  dedent`
    Spring.MoveCtrl = {}
  `
);
