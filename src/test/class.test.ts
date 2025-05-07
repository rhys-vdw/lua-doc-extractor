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
  "Handles class with multiple base classes and trailing description",
  dedent`
    /***
     * Here's a description...
     *
     * @class Foo : Bar, Baz, table<string, number>, (A|B) A bit more...
     *
     * Another line!
     */
  `,
  dedent`
    ---Here's a description...
    ---
    ---@class Foo : Bar, Baz, table<string, number>, (A|B) A bit more...
    ---
    ---Another line!
    local Foo = {}
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
    ---@field union Bar|Baz Bar or baz?
    ---@field generic Foo<Bar|Baz> A generic.
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

testInput(
  "Class with index-style numeric fields",
  dedent`
    /***
     * @class ControlPoint
     *
     * NURBS control point.
     *
     * @field [1] number x
     * @field [2] number y
     * @field [3] number z
     * @field [4] number weight
     */
  `,
  // NOTE: Removing blank lines is undesirable, but makes no functional
  // difference.
  dedent`
    ---@class ControlPoint
    ---NURBS control point.
    ---@field [1] number x
    ---@field [2] number y
    ---@field [3] number z
    ---@field [4] number weight
    local ControlPoint = {}
  `
);

testInput(
  "Class with index-style string fields",
  dedent`
    /***
     * @class Example
     *
     * @field ["hello"] "world" World.
     * @field ["foo"] integer A number.
     */
  `,
  dedent`
    ---@class Example
    ---@field ["hello"] "world" World.
    ---@field ["foo"] integer A number.
    local Example = {}
  `
);

testInput(
  "Class with nested tables",
  dedent`
    /***
     * @class Foo.Bar
     *
     * @field a Foo.Bar
     */
  `,
  dedent`
    ---@class Foo.Bar
    ---@field a Foo.Bar
    Foo.Bar = {}
  `
);
