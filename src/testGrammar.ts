import nearley from "nearley";
import grammar from "./grammar";
import dedent from "dedent-js";

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

parser.feed(dedent`
First, Last
Joe, Schmoe
Bob, Dobbs
`);

console.log(parser.results);
