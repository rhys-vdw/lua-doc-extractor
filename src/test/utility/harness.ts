import test from "tape";
import { members } from "../..";
import { Comment, getComments } from "../../comment";
import { docLexer } from "../../docLexer";

export function testInput(
  name: string,
  input: string,
  expectedLua?: string,
  expectedComments?: readonly Comment[],
  only: boolean = false
) {
  const testFn = only ? test.only : test;
  testFn(name, (t) => {
    const [comments, error] = getComments(input);
    t.error(error, "getComments succeeds");

    if (expectedComments !== undefined) {
      t.deepEqual(comments, expectedComments, "getComments has correct output");
    }

    comments?.forEach(({ text }) => {
      t.doesNotThrow(() => {
        docLexer.reset(text);
        Array.from(docLexer);
      }, `Successfully lexes comment: '${text.substring(0, 20)}...'`);
    });

    const [luaResult, err] = members(input, "PATH");

    if (err != null) {
      t.error(err, "members succeeds");
    } else {
      t.equal(luaResult.docErrors.length, 0, "docErrors is empty");
      luaResult.docErrors.forEach((e, i) => {
        t.true(e instanceof Error, `docError: ${i} is an error`);
        t.error(e, `docError: ${i}`);
      });

      if (expectedLua !== undefined) {
        t.isEqual(luaResult.lua, expectedLua, "members has correct output");
      }

      if (only) {
        console.log("---EXPECTED---");
        console.log(expectedLua);
        console.log("---ACTUAL---");
        console.log(luaResult.lua);
      }
    }

    t.end();
  });
}
