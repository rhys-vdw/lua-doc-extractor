import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Ignores trailing whitespace",
  [
    "/***",
    " * @class Foo",
    " * @field disabled boolean",
    " * @field name string ",
    " * @field value string ",
    " * @field submitted boolean",
    " */",
  ].join("\n"),
  dedent`
    ---@class Foo
    ---@field disabled boolean
    ---@field name string
    ---@field value string
    ---@field submitted boolean
    local Foo = {}
  `
);
