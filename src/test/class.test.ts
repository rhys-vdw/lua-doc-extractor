import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Generates class.",
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
    local Car = {
    \t---@type integer
    \tdoorCount = nil,

    \t---@type number How fast can this baby go?
    \tmaxSpeed = nil,

    \t---@type string The manufacter.
    \tmake = nil,

    \t---@type string The model of the car.
    \tmodel = nil
    }
  `
);

testInput(
  "Handles generic class.",
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
