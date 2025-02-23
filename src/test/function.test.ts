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
