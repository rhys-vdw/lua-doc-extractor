import test from "tape";
import { members } from "../..";
import { getComments } from "../../comment";
import { docLexer } from "../../docLexer";

export function testInput(
  name: string,
  input: string,
  expected: string,
  only: boolean = false
) {
  const testFn = only ? test.only : test;
  testFn(name, (t) => {
    const [comments, error] = getComments(input);
    t.error(error, "getComments succeeds");

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
      luaResult.docErrors.forEach((e) => t.error(e, "docError"));

      t.isEqual(luaResult.lua, expected, "members has correct output");

      if (only) {
        console.log("---EXPECTED---");
        console.log(expected);
        console.log("---ACTUAL---");
        console.log(luaResult.lua);
      }
    }

    t.end();
  });
}
