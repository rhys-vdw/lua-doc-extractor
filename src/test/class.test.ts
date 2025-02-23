import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Parses /*** comments only.",
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
