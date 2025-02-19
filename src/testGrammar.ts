import nearley from "nearley";
import grammar, { Doc } from "./grammar.ne";
import { inspect } from "util";
import { Token } from "moo";
import { docLexer } from "./docLexer";

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

const d = `
foo \`blah\` bar
\`\`\`bingo
   foo
\`\`\`
boop

@param Foo bar blah

dingo
   dingo \`doo\`
`;

function parse(input: string) {
  parser.feed(input);

  // console.log(inspect(parser.results, { depth: Infinity }));

  function joinTokens(tokens: Token[]): string {
    return tokens.map((t) => t.text).join("");
  }

  const doc = parser.results[0] as Doc;

  console.log(doc);

  console.log("-----DESC-----");
  console.log(joinTokens(doc.description));
  doc.attributes.forEach((attr) => {
    console.log("-----ATTR-----");
    console.log(attr.type.text);
    console.log(joinTokens(attr.description));
  });
}

function detail(input: string) {
  const result = [];
  docLexer.reset(input);
  for (const entry of docLexer) {
    const t = `'${entry.text.replace("\t", "\\t")}'`;
    result.push(
      `${entry.type} -> ${t.padStart(15 + t.length - entry.type!.length)}`
    );
  }
  console.log(result.join("\n"));
}

console.log("det");
// detail(d);

parse(d);
