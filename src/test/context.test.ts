import dedent from "dedent-js";
import test from "tape";
import { getDocs } from "..";
import {
  applyFileContexts,
  getDocContexts,
  getDocTableName,
  lintDuplicateDeclarations,
  projectOutputs,
  removeContextAttributes,
} from "../context";
import { Doc } from "../doc";

function parseDocs(input: string, path = "test.cpp"): Doc[] {
  const [result, err] = getDocs(input, path);
  if (err != null) throw err;
  return result[0];
}

// --- getDocTableName ---

test("getDocTableName: function with table prefix", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Spring.Foo
     */
  `);
  t.equal(getDocTableName(docs[0]), "Spring");
  t.end();
});

test("getDocTableName: bare function returns null", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Foo
     */
  `);
  t.equal(getDocTableName(docs[0]), null);
  t.end();
});

test("getDocTableName: SpringSynced qualified function", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function SpringSynced.GiveOrderToUnit
     */
  `);
  t.equal(getDocTableName(docs[0]), "SpringSynced");
  t.end();
});

test("getDocTableName: table declaration", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @table MoveCtrl
     */
  `);
  t.equal(getDocTableName(docs[0]), "MoveCtrl");
  t.end();
});

// --- projectOutputs: Spring-bucket routing ---

test("projectOutputs: SpringShared goes to shared.lua", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function SpringShared.Echo
     */
  `);
  const outputs = projectOutputs([["a.cpp", docs]]);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "shared.lua");
  t.ok(outputs[0].preamble.includes("---@class SpringShared"));
  t.end();
});

test("projectOutputs: SpringSynced goes to synced.lua", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function SpringSynced.GiveOrderToUnit
     */
  `);
  const outputs = projectOutputs([["a.cpp", docs]]);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "synced.lua");
  t.ok(outputs[0].preamble.includes("---@class SpringSynced"));
  t.end();
});

test("projectOutputs: SpringUnsynced goes to unsynced.lua", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function SpringUnsynced.GetMouseState
     */
  `);
  const outputs = projectOutputs([["a.cpp", docs]]);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "unsynced.lua");
  t.ok(outputs[0].preamble.includes("---@class SpringUnsynced"));
  t.end();
});

test("projectOutputs: non-Spring tables fall through to shared.lua", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function MoveCtrl.Enable
     */
  `);
  const outputs = projectOutputs([["a.cpp", docs]]);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "shared.lua");
  // MoveCtrl's @class is authored separately; no preamble synthesized.
  t.notOk(outputs[0].preamble.includes("MoveCtrl"));
  t.end();
});

test("projectOutputs: mixed Spring buckets produce three files", (t) => {
  const docsA = parseDocs(
    dedent`
      /***
       * @function SpringSynced.GiveOrderToUnit
       */
    `,
    "a.cpp"
  );
  const docsB = parseDocs(
    dedent`
      /***
       * @function SpringUnsynced.GetMouseState
       */
    `,
    "b.cpp"
  );
  const docsC = parseDocs(
    dedent`
      /***
       * @function SpringShared.GetUnitPosition
       */
    `,
    "c.cpp"
  );
  const outputs = projectOutputs([
    ["a.cpp", docsA],
    ["b.cpp", docsB],
    ["c.cpp", docsC],
  ]);
  const names = outputs.map((o) => o.name).sort();
  t.deepEqual(names, ["shared.lua", "synced.lua", "unsynced.lua"]);
  t.end();
});

test("projectOutputs: same bucket across files merges into one output", (t) => {
  const docsA = parseDocs(
    dedent`
      /***
       * @function SpringSynced.Foo
       */
    `,
    "a.cpp"
  );
  const docsB = parseDocs(
    dedent`
      /***
       * @function SpringSynced.Bar
       */
    `,
    "b.cpp"
  );
  const outputs = projectOutputs([
    ["a.cpp", docsA],
    ["b.cpp", docsB],
  ]);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "synced.lua");
  t.equal(outputs[0].docs.length, 2);
  t.deepEqual(outputs[0].sources.sort(), ["a.cpp", "b.cpp"]);
  t.end();
});

test("projectOutputs: preamble dedup (one @class per bucket even across docs)", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function SpringSynced.Foo
     */

    /***
     * @function SpringSynced.Bar
     */
  `);
  const outputs = projectOutputs([["a.cpp", docs]]);
  t.equal(outputs.length, 1);
  // `---@class SpringSynced` should appear once in the preamble, not twice.
  const matches = outputs[0].preamble.match(/---@class SpringSynced/g) ?? [];
  t.equal(matches.length, 1);
  t.end();
});

// --- lintDuplicateDeclarations ---

test("lintDuplicateDeclarations: flags same @function in two files", (t) => {
  const docsA = parseDocs(
    dedent`
      /***
       * @function SpringSynced.Foo
       */
    `,
    "a.cpp"
  );
  const docsB = parseDocs(
    dedent`
      /***
       * @function SpringSynced.Foo
       */
    `,
    "b.cpp"
  );
  const errors = lintDuplicateDeclarations([
    ["a.cpp", docsA],
    ["b.cpp", docsB],
  ]);
  t.equal(errors.length, 1);
  t.ok(errors[0].includes("SpringSynced.Foo"));
  t.ok(errors[0].includes("a.cpp"));
  t.ok(errors[0].includes("b.cpp"));
  t.end();
});

test("lintDuplicateDeclarations: ignores same @function duplicated in one file", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function SpringSynced.Foo
     */

    /***
     * @function SpringSynced.Foo
     */
  `);
  const errors = lintDuplicateDeclarations([["a.cpp", docs]]);
  t.equal(errors.length, 0);
  t.end();
});

test("lintDuplicateDeclarations: ignores non-function duplicates", (t) => {
  const docsA = parseDocs(
    dedent`
      /***
       * @class MoveCtrl
       */
    `,
    "a.cpp"
  );
  const docsB = parseDocs(
    dedent`
      /***
       * @class MoveCtrl
       */
    `,
    "b.cpp"
  );
  const errors = lintDuplicateDeclarations([
    ["a.cpp", docsA],
    ["b.cpp", docsB],
  ]);
  t.equal(errors.length, 0);
  t.end();
});

test("lintDuplicateDeclarations: silent when all names are unique", (t) => {
  const docsA = parseDocs(
    dedent`
      /***
       * @function SpringSynced.Foo
       */
    `,
    "a.cpp"
  );
  const docsB = parseDocs(
    dedent`
      /***
       * @function SpringSynced.Bar
       */
    `,
    "b.cpp"
  );
  const errors = lintDuplicateDeclarations([
    ["a.cpp", docsA],
    ["b.cpp", docsB],
  ]);
  t.equal(errors.length, 0);
  t.end();
});

// --- removeContextAttributes (defensive no-op stripper) ---

test("removeContextAttributes: strips stray @env", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function SpringSynced.Foo
     * @env synced
     */
  `);
  removeContextAttributes(docs);
  const hasContext = docs[0].attributes.some((a) => a.attributeType === "env");
  t.notOk(hasContext);
  t.end();
});

// --- getDocContexts ---

test("getDocContexts: single context", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Foo.Bar
     * @env synced
     */
  `);
  t.deepEqual(getDocContexts(docs[0]), ["synced"]);
  t.end();
});

test("getDocContexts: comma-separated contexts", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Foo.Bar
     * @env synced, unsynced
     */
  `);
  t.deepEqual(getDocContexts(docs[0]).sort(), ["synced", "unsynced"]);
  t.end();
});

test("getDocContexts: no @env returns empty", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Foo.Bar
     */
  `);
  t.deepEqual(getDocContexts(docs[0]), []);
  t.end();
});

// --- applyFileContexts ---

test("applyFileContexts: standalone @env stamps subsequent docs", (t) => {
  const docs = parseDocs(dedent`
    /*** @env synced */

    /***
     * @function UnitScript.AttachUnit
     */

    /***
     * @function UnitScript.DropUnit
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  const errors = applyFileContexts(entries);
  t.deepEqual(errors, []);
  t.equal(entries[0][1].length, 2, "standalone marker doc removed");
  t.deepEqual(getDocContexts(entries[0][1][0]), ["synced"]);
  t.deepEqual(getDocContexts(entries[0][1][1]), ["synced"]);
  t.end();
});

test("applyFileContexts: existing @env on doc is preserved", (t) => {
  const docs = parseDocs(dedent`
    /*** @env synced */

    /***
     * @function Foo.Bar
     * @env unsynced
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  applyFileContexts(entries);
  t.deepEqual(getDocContexts(entries[0][1][0]), ["unsynced"]);
  t.end();
});

test("applyFileContexts: no standalone marker is a no-op", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Foo.Bar
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  const errors = applyFileContexts(entries);
  t.deepEqual(errors, []);
  t.equal(entries[0][1].length, 1);
  t.deepEqual(getDocContexts(entries[0][1][0]), []);
  t.end();
});

test("applyFileContexts: marker not at file start is an error", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Foo.Bar
     */

    /*** @env synced */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  const errors = applyFileContexts(entries);
  t.equal(errors.length, 1);
  t.ok(errors[0].includes("must be the first doc"));
  t.end();
});

test("applyFileContexts: multiple markers in one file is an error", (t) => {
  const docs = parseDocs(dedent`
    /*** @env synced */

    /*** @env unsynced */

    /***
     * @function Foo.Bar
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  const errors = applyFileContexts(entries);
  t.equal(errors.length, 1);
  t.ok(errors[0].includes("multiple file-level @env"));
  t.end();
});

// --- projectOutputs: @env fallback for non-Spring tables ---

test("projectOutputs: non-Spring table with @env synced routes to synced.lua", (t) => {
  const docs = parseDocs(dedent`
    /*** @env synced */

    /***
     * @function UnitScript.AttachUnit
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  applyFileContexts(entries);
  const outputs = projectOutputs(entries);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "synced.lua");
  t.end();
});

test("projectOutputs: non-Spring table with @env unsynced routes to unsynced.lua", (t) => {
  const docs = parseDocs(dedent`
    /*** @env unsynced */

    /***
     * @function ObjectRenderingTable.SetLODCount
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  applyFileContexts(entries);
  const outputs = projectOutputs(entries);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "unsynced.lua");
  t.end();
});

test("projectOutputs: Spring prefix wins over @env fallback", (t) => {
  const docs = parseDocs(dedent`
    /*** @env unsynced */

    /***
     * @function SpringSynced.Foo
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  applyFileContexts(entries);
  const outputs = projectOutputs(entries);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "synced.lua");
  t.end();
});

test("projectOutputs: multi-context doc falls through to shared.lua", (t) => {
  const docs = parseDocs(dedent`
    /*** @env synced, unsynced */

    /***
     * @function SomeTable.Foo
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  applyFileContexts(entries);
  const outputs = projectOutputs(entries);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "shared.lua");
  t.end();
});
