import test from "tape";
import { members } from "../..";

export function testMembers(name: string, input: string, expected: string) {
  test(name, (t) => {
    t.isEqual(members(input), expected, "Has correct output");
    t.end();
  });
}
