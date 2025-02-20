import test from "tape";
import { members } from "../..";

export function testMembers(
  name: string,
  input: string,
  expected: string,
  only: boolean = false
) {
  const testFn = only ? test.only : test;
  testFn(name, (t) => {
    const [actual, err] = members(input, "PATH");
    if (err != null) {
      t.error(err);
    } else {
      t.isEqual(actual, expected, "Has correct output");
    }
    t.end();

    if (only) {
      console.log("---EXPECTED---");
      console.log(expected);
      console.log("---ACTUAL---");
      console.log(actual);
    }
  });
}
