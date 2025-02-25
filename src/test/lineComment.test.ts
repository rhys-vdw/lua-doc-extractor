import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Ignores ///////+ comment",
  dedent`
    /////////////////////////////////

    bool LuaVBOImpl::IsTypeValid(GLenum type)
    {
      const auto arrayBufferValidType = [type]() {

  `,
  ``
);

testInput(
  "Handles /// style single line comments",
  dedent`
    /// Some text.
    /// @table Foo Foo is good.
    we need some code here for it to match
  `,
  dedent`
    ---Some text.
    ---
    ---Foo is good.
    Foo = {}
  `,
  [
    {
      start: { line: 1, col: 1 },
      end: { line: 2, col: 28 },
      text: dedent`
        Some text.
        @table Foo Foo is good.
      `,
    },
  ]
);
