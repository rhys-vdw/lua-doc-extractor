import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Generates class",
  dedent`
    /***
     * @class Car
     * @field doorCount integer
     * @field maxSpeed number How fast can this baby go?
     * @field make string The manufacter.
     * @field model string The model of the car.
     */
  `,
  dedent`
    ---@class Car
    ---@field doorCount integer
    ---@field maxSpeed number How fast can this baby go?
    ---@field make string The manufacter.
    ---@field model string The model of the car.
    local Car = {}
  `
);

testInput(
  "Handles generic class",
  dedent`
    /***
     * A table of uniform name to value.
     *
     * @class UniformParam<T> : { [string]: T|T[] }
     */
  `,
  dedent`
    ---A table of uniform name to value.
    ---
    ---@class UniformParam<T> : { [string]: T|T[] }
    local UniformParam = {}
  `
);

testInput(
  "Handles complicated field type",
  dedent`
    /***
     * @class Widget
     * @field union Bar | Baz Bar or baz?
     * @field generic Foo<Bar | Baz> A generic.
     */
  `,
  dedent`
    ---@class Widget
    ---@field union Bar | Baz Bar or baz?
    ---@field generic Foo<Bar | Baz> A generic.
    local Widget = {}
  `
);

testInput(
  "Global class",
  dedent`
    /***
     * @class Widget
     * @table widget
     * @field a integer
     */

    /***
     * @function widget.Foo
     * @param b integer
     */
  `,
  dedent`
    ---@class Widget
    ---@field a integer
    widget = {}

    ---@param b integer
    function widget.Foo(b) end
  `
);
