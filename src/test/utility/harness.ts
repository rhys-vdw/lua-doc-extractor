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
    const actual = members(input, "PATH");
    t.isEqual(actual, expected, "Has correct output");

    if (only) {
      console.log("---EXPECTED---");
      console.log(expected);
      console.log("---ACTUAL---");
      console.log(actual);
    }
    t.end();
  });
}
