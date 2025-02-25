import dedent from "dedent-js";
import { testInput } from "./utility/harness";

testInput(
  "Parses /*** comments only.",
  dedent`
    /***
     * @table Foo
     */

    /**
     * @table Bar
     */
  `,
  dedent`
    Foo = {}
  `
);

testInput(
  "Parses single line @table attribute.",
  dedent`
    /*** @table Foo */
  `,
  dedent`
    Foo = {}
  `
);

testInput(
  "Parses single line @deprecated attribute.",
  dedent`
    /*** @deprecated */
  `,
  dedent`
    ---@deprecated
  `
);

testInput(
  "Ignores extra asterisks after /***",
  dedent`
    /****************
     * @table Foo
     */
  `,
  dedent`
    Foo = {}
  `
);

testInput(
  "Single attribute followed by newline and text",
  dedent`
    /***
     * @usage
     * another line
     */
  `,
  dedent`
    ---@usage
    ---another line
  `
);

testInput(
  "Correctly handles double quotes inline code",
  dedent`
    /***
     * @param message string \`\`"\`<PLAYER#>\`"\`\` where \`#\` is a player ID.
     */
  `,
  dedent`
    ---@param message string \`\`"\`<PLAYER#>\`"\`\` where \`#\` is a player ID.
  `
);

testInput(
  "Ignores empty comments",
  dedent`
    /***
     *
     */
  `,
  ""
);
