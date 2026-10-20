import dedent from "dedent-js";
import test from "tape";
import { getDocs } from "..";
import {
  applyFileEnvs,
  envKey,
  getDocEnvs,
  parseEnvOutputs,
  projectOutputs,
  removeEnvAttributes,
} from "../env";
import { Doc } from "../doc";
import { formatAttribute, isAttribute } from "../attribute";

const perFile = (path: string) => `${path}.lua`;

// Three routes over two environments: each one alone, and both.
const ROUTES = parseEnvOutputs([
  "server=server.lua",
  "client=client.lua",
  "server,client=common.lua",
])[0];

function parseDocs(input: string, path = "test.cpp"): Doc[] {
  const [result, err] = getDocs(input, path);
  if (err != null) throw err;
  return result[0];
}

// --- envKey / parseEnvOutputs ---

test("envKey: sorts, trims and dedups the names", (t) => {
  t.equal(envKey(["client", " server", "server"]), "client,server");
  t.equal(envKey(["server"]), "server");
  t.end();
});

test("parseEnvOutputs: name[,name...]=file, in any order", (t) => {
  const [outputs, errors] = parseEnvOutputs([
    "server=server.lua",
    "client, server=common.lua",
  ]);
  t.deepEqual(errors, []);
  t.equal(outputs.get("server"), "server.lua");
  t.equal(outputs.get("client,server"), "common.lua");
  t.end();
});

test("parseEnvOutputs: a malformed or repeated route is an error", (t) => {
  const [outputs, errors] = parseEnvOutputs([
    "server",
    "=a.lua",
    "server=a.lua",
    "server=b.lua",
  ]);
  t.equal(outputs.size, 1);
  t.equal(errors.length, 3);
  t.ok(errors[0].includes("expected name[,name...]=file"));
  t.ok(errors[2].includes("already routed"));
  t.end();
});

// --- projectOutputs ---

test("projectOutputs: a doc without @env goes to the default output", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Game.Print
     */
  `);
  const [outputs, errors] = projectOutputs([["a.cpp", docs]], ROUTES, perFile);
  t.deepEqual(errors, []);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "a.cpp.lua");
  t.deepEqual(outputs[0].sources, ["a.cpp"]);
  t.end();
});

test("projectOutputs: without --env the tags change nothing", (t) => {
  const docs = parseDocs(dedent`
    /*** @env server */

    /***
     * @function Game.Save
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  applyFileEnvs(entries);
  const [outputs, errors] = projectOutputs(entries, new Map(), perFile);
  t.deepEqual(errors, []);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "a.cpp.lua");
  t.end();
});

test("projectOutputs: a tagged doc goes to its env's file", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Game.Save
     * @env server
     */
  `);
  const [outputs, errors] = projectOutputs([["a.cpp", docs]], ROUTES, perFile);
  t.deepEqual(errors, []);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "server.lua");
  t.end();
});

test("projectOutputs: a doc in both environments goes to the file for both, whatever the order", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Game.Log
     * @env client, server
     */
  `);
  const [outputs, errors] = projectOutputs([["a.cpp", docs]], ROUTES, perFile);
  t.deepEqual(errors, []);
  t.equal(outputs[0].name, "common.lua");
  t.end();
});

test("projectOutputs: the file-level @env routes the file, a doc's own @env overrides it", (t) => {
  const docs = parseDocs(dedent`
    /*** @env client */

    /***
     * @function Game.GetMouse
     */

    /***
     * @function Game.Log
     * @env server, client
     */
  `);
  const entries: [string, Doc[]][] = [["client.cpp", docs]];
  applyFileEnvs(entries);
  const [outputs, errors] = projectOutputs(entries, ROUTES, perFile);
  t.deepEqual(errors, []);
  const names = outputs.map((o) => o.name).sort();
  t.deepEqual(names, ["client.lua", "common.lua"]);
  t.end();
});

test("projectOutputs: the same env across files merges into one output", (t) => {
  const docsA = parseDocs(
    dedent`
      /***
       * @function Game.Foo
       * @env server
       */
    `,
    "a.cpp",
  );
  const docsB = parseDocs(
    dedent`
      /***
       * @function Game.Bar
       * @env server
       */
    `,
    "b.cpp",
  );
  const [outputs] = projectOutputs(
    [
      ["a.cpp", docsA],
      ["b.cpp", docsB],
    ],
    ROUTES,
    perFile,
  );
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "server.lua");
  t.equal(outputs[0].docs.length, 2);
  t.deepEqual(outputs[0].sources.sort(), ["a.cpp", "b.cpp"]);
  t.end();
});

test("projectOutputs: tagged and untagged docs from one file part ways", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Game.Foo
     * @env server
     */

    /***
     * @function Game.Bar
     */
  `);
  const [outputs] = projectOutputs([["a.cpp", docs]], ROUTES, perFile);
  const names = outputs.map((o) => o.name).sort();
  t.deepEqual(names, ["a.cpp.lua", "server.lua"]);
  t.end();
});

test("projectOutputs: an unrouted env is one error per file and env", (t) => {
  const docs = parseDocs(dedent`
    /*** @env menu */

    /***
     * @function Game.Foo
     */

    /***
     * @function Game.Bar
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  applyFileEnvs(entries);
  const [outputs, errors] = projectOutputs(entries, ROUTES, perFile);
  t.equal(outputs.length, 0);
  t.equal(errors.length, 1);
  t.ok(errors[0].includes("'a.cpp'"));
  t.ok(errors[0].includes("'menu'"));
  t.end();
});

test("projectOutputs: a constants enum routes by the file-level @env", (t) => {
  const docs = parseDocs(dedent`
    /*** @env client */

    /***
     * @enum Key
     */
  `);
  const entries: [string, Doc[]][] = [["keys.cpp", docs]];
  applyFileEnvs(entries);
  const [outputs] = projectOutputs(entries, ROUTES, perFile);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "client.lua");
  t.end();
});

test("projectOutputs: a constants table in both environments lands in the file for both", (t) => {
  const docs = parseDocs(dedent`
    /*** @env server, client */

    /***
     * @table Version
     */
  `);
  const entries: [string, Doc[]][] = [["version.cpp", docs]];
  applyFileEnvs(entries);
  const [outputs] = projectOutputs(entries, ROUTES, perFile);
  t.equal(outputs.length, 1);
  t.equal(outputs[0].name, "common.lua");
  t.end();
});

// --- removeEnvAttributes (defensive no-op stripper) ---

test("removeEnvAttributes: strips stray @env", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Recoil.Synced.Foo
     * @env server
     */
  `);
  removeEnvAttributes(docs);
  const hasEnv = docs[0].attributes.some((a) => a.attributeType === "env");
  t.notOk(hasEnv);
  t.end();
});

// --- the attribute ---

test("@env: parsed names, a continuation line is description, never formatted", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Foo.Bar
     * @env server, client
     * only on the two
     */
  `);
  const env = docs[0].attributes.find((a) => a.attributeType === "env");
  t.ok(env);
  if (env && isAttribute(env, "env")) {
    t.deepEqual(env.args.names, ["server", "client"]);
    t.equal(env.args.description.trim(), "only on the two");
    t.equal(formatAttribute(env), "");
  }
  t.end();
});

// --- getDocEnvs ---

test("getDocEnvs: single env", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Foo.Bar
     * @env server
     */
  `);
  t.deepEqual(getDocEnvs(docs[0]), ["server"]);
  t.end();
});

test("getDocEnvs: comma-separated envs", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Foo.Bar
     * @env server, client
     */
  `);
  t.deepEqual(getDocEnvs(docs[0]).sort(), ["client", "server"]);
  t.end();
});

test("getDocEnvs: no @env returns empty", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Foo.Bar
     */
  `);
  t.deepEqual(getDocEnvs(docs[0]), []);
  t.end();
});

// --- applyFileEnvs ---

test("applyFileEnvs: standalone @env stamps subsequent docs", (t) => {
  const docs = parseDocs(dedent`
    /*** @env server */

    /***
     * @function Game.Attach
     */

    /***
     * @function Game.Drop
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  const errors = applyFileEnvs(entries);
  t.deepEqual(errors, []);
  t.equal(entries[0][1].length, 2, "standalone marker doc removed");
  t.deepEqual(getDocEnvs(entries[0][1][0]), ["server"]);
  t.deepEqual(getDocEnvs(entries[0][1][1]), ["server"]);
  t.end();
});

test("applyFileEnvs: existing @env on doc is preserved", (t) => {
  const docs = parseDocs(dedent`
    /*** @env server */

    /***
     * @function Foo.Bar
     * @env client
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  applyFileEnvs(entries);
  t.deepEqual(getDocEnvs(entries[0][1][0]), ["client"]);
  t.end();
});

test("applyFileEnvs: no standalone marker is a no-op", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Foo.Bar
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  const errors = applyFileEnvs(entries);
  t.deepEqual(errors, []);
  t.equal(entries[0][1].length, 1);
  t.deepEqual(getDocEnvs(entries[0][1][0]), []);
  t.end();
});

test("applyFileEnvs: marker not at file start is an error", (t) => {
  const docs = parseDocs(dedent`
    /***
     * @function Foo.Bar
     */

    /*** @env server */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  const errors = applyFileEnvs(entries);
  t.equal(errors.length, 1);
  t.ok(errors[0].includes("must be the first doc"));
  t.end();
});

test("applyFileEnvs: multiple markers in one file is an error", (t) => {
  const docs = parseDocs(dedent`
    /*** @env server */

    /*** @env client */

    /***
     * @function Foo.Bar
     */
  `);
  const entries: [string, Doc[]][] = [["a.cpp", docs]];
  const errors = applyFileEnvs(entries);
  t.equal(errors.length, 1);
  t.ok(errors[0].includes("multiple file-level @env"));
  t.end();
});

