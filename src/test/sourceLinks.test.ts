import dedent from "dedent-js";
import test from "tape";
import { formatSource } from "../source";
import { testInput } from "./utility/harness";

test("formatSource", (t) => {
  t.test("Should format source", (t) => {
    const repoUrl = "https://github.com/rhys-vdw/lua-doc-extractor/blob/main/";
    const expected = `[<a href=\"https://github.com/rhys-vdw/lua-doc-extractor/blob/main/path/to/FILE.txt#L1-L69\" target=\"_blank\">source</a>]`;
    const actual = formatSource(repoUrl, {
      path: "path/to/FILE.txt",
      start: { line: 1, col: 1 },
      end: { line: 69, col: 5 },
    });
    t.equal(actual, expected);
    t.end();
  });

  t.test("With leading / on path", (t) => {
    const repoUrl = "https://github.com/rhys-vdw/lua-doc-extractor/blob/main/";
    const expected = `[<a href=\"https://github.com/rhys-vdw/lua-doc-extractor/blob/main/FILE.txt#L1-L2\" target=\"_blank\">source</a>]`;
    const actual = formatSource(repoUrl, {
      path: "/FILE.txt",
      start: { line: 1, col: 1 },
      end: { line: 2, col: 1 },
    });
    t.equal(actual, expected);
    t.end();
  });
});

testInput(
  "Extract with source links",
  dedent`
    /***
     * @table MyTable
     */

    /***
     * @function MyTable.Boop
     * @param x number
     */
  `,
  dedent`
    ---[<a href=\"https://github.com/rhys-vdw/lua-doc-extractor/blob/main/cool/file.txt#L1-L3\" target=\"_blank\">source</a>]
    MyTable = {}

    ---[<a href=\"https://github.com/rhys-vdw/lua-doc-extractor/blob/main/cool/file.txt#L5-L8\" target=\"_blank\">source</a>]
    ---
    ---@param x number
    function MyTable.Boop(x) end
  `,
  undefined,
  {
    path: "cool/file.txt",
    repoUrl: "https://github.com/rhys-vdw/lua-doc-extractor/blob/main/",
  }
);

testInput(
  "Does not add source links if nothing is generated",
  dedent`
    /*************************************/

    /*************************************/

    /*************************************/
  `,
  "",
  undefined,
  {
    path: "cool/file.txt",
    repoUrl: "https://github.com/rhys-vdw/lua-doc-extractor/blob/main/",
  }
);
