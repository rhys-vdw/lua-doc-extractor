import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Generates function with params",
  dedent`
    /*** Called when a unit emits a seismic ping.
     *
     * @function UnitSeismicPing
     *
     * See \`seismicSignature\`.
     *
     * @param x number
     * @param y number
     * @param z number
     */
    `,
  dedent`
    ---Called when a unit emits a seismic ping.
    ---
    ---See \`seismicSignature\`.
    ---
    ---@param x number
    ---@param y number
    ---@param z number
    function UnitSeismicPing(x, y, z) end
  `
);

testInput(
  "Generic function",
  dedent`
    /***
     * Does foo.
     *
     * @function SomeTable.Foo
     *
     * @generic T : integer
     * @param x T
     * @param y integer
     */
    `,
  dedent`
    ---Does foo.
    ---
    ---@generic T : integer
    ---@param x T
    ---@param y integer
    function SomeTable.Foo(x, y) end
  `
);

testInput(
  "Method",
  dedent`
    /***
     * Does foo.
     *
     * @function SomeTable:Foo
     * @param x integer
     */
    `,
  dedent`
    ---Does foo.
    ---
    ---@param x integer
    function SomeTable:Foo(x) end
  `
);

testInput(
  "Variadic function param",
  dedent`
    /***
     * Does foo.
     *
     * @function variadic
     * @param name string
     * @param ... integer
     */
    `,
  dedent`
    ---Does foo.
    ---
    ---@param name string
    ---@param ... integer
    function variadic(name, ...) end
  `
);

testInput(
  "Variadic function return",
  dedent`
    /***
     * @function returner
     * @return ... integer
     */
    `,
  dedent`
    ---@return ... integer
    function returner() end
  `
);

testInput(
  "Nested table function",
  dedent`
    /***
     * @function Foo.Bar.baz
     */
    `,
  dedent`
    function Foo.Bar.baz() end
  `
);

testInput(
  "Nested table method",
  dedent`
    /***
     * @function Foo.Bar.baz
     */
    `,
  dedent`
    function Foo.Bar.baz() end
  `
);
