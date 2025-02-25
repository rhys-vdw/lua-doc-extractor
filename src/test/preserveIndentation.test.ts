import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Preserves indentation in main description",
  dedent`
  /***
   * This is a list:
   * - Foo
   *   - Bar
   *     - Baz
   * @table List
   */
  `,
  dedent`
    ---This is a list:
    ---- Foo
    ---  - Bar
    ---    - Baz
    List = {}
  `
);

testInput(
  "Preserves indentation in param description",
  dedent`
    /***
     * @param options string? concatenated string of option characters.
     *
     *   - horizontal alignment:
     *     - 'c' = center
     *     - 'r' = right
     *   - vertical alignment:
     *     - 'a' = ascender
     *     - 't' = top
     *     - 'v' = vertical center
     *     - 'x' = baseline
     *     - 'b' = bottom
     *     - 'd' = descender
     */
  `,
  dedent`
    ---@param options string? concatenated string of option characters.
    ---
    ---  - horizontal alignment:
    ---    - 'c' = center
    ---    - 'r' = right
    ---  - vertical alignment:
    ---    - 'a' = ascender
    ---    - 't' = top
    ---    - 'v' = vertical center
    ---    - 'x' = baseline
    ---    - 'b' = bottom
    ---    - 'd' = descender
  `
);

testInput(
  "Preserves indentation in code block",
  dedent`
    /***
     * \`\`\`lua
     * for i = 1, #teams do
     *   if teams[i] ~= teamID and not select(2, Spring.GetTeamInfo(teams[i], false)) then
     *   aliveTeams = aliveTeams + 1
     * end
     * \`\`\`
     * @function Foo
     */
  `,
  dedent`
    ---\`\`\`lua
    ---for i = 1, #teams do
    ---  if teams[i] ~= teamID and not select(2, Spring.GetTeamInfo(teams[i], false)) then
    ---  aliveTeams = aliveTeams + 1
    ---end
    ---\`\`\`
    function Foo() end
  `
);
