import dedent from "dedent-js";
import { testMembers } from "./utility/harness";

testMembers(
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

testMembers(
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
