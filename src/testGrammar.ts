import nearley from "nearley";
import grammar from "./grammar.ne";
import { inspect } from "util";

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

const c = `
\`\`\`lua
Here is
  some code! \`
blah
\`\`\`
Changes the value
\`@function Spring.SetAlly\`
@param firstAllyTeamID integer
`;

parser.feed(c);

console.log(inspect(parser.results, { depth: Infinity }));
