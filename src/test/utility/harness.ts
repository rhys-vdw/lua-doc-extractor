import test from "tape";
import { formatDocs, getDocs, processDocs } from "../..";
import { Comment, getComments } from "../../comment";
import { docLexer } from "../../docLexer";

export interface TestInputOptions {
  repoUrl?: string;
  only?: boolean;
  path?: string;
}

export function testInput(
  name: string,
  input: string,
  expected?: string,
  expectedComments?: readonly Comment[],
  { only, repoUrl, path = "PATH" }: TestInputOptions = {}
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

    const [docResult, err] = getDocs(input, path);

    if (err != null) {
      t.error(err, "getDocs succeeds");
    } else {
      const [docs, docErrors] = docResult;
      t.equal(docErrors.length, 0, "docErrors is empty");
      docErrors.forEach((e, i) => {
        t.true(e instanceof Error, `docError: ${i} is an error`);
        t.error(e, `docError: ${i}`);
      });

      processDocs(docs);

      const actual = formatDocs(docs, repoUrl || null);

      if (expected !== undefined) {
        t.isEqual(actual, expected, "members has correct output");
      }

      if (only) {
        console.log(">>>EXPECTED>>>");
        console.log(expected);
        console.log("<<<ACTUAL<<<");
        console.log(actual);
      }
    }

    t.end();
  });
}
