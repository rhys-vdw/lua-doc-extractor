import moo from "moo";

const lexer = moo.states({
  code: {
    blockCommentStart: { match: "/***", push: "blockComment" },
    word: /[^\s]+/,
    space: { match: /\s+/, lineBreaks: true },
  },
  blockComment: {
    newline: "\n",
    indent: /^\s+\*(?!\/)/,
    blockCommentEnd: { match: "*/", pop: 1 },
    word: { match: /[^\s$]+/ },
    space: /[ \t]+/,
  },
});

const c = `/*** Changes the value of the (one-sided) alliance between: firstAllyTeamID -> secondAllyTeamID.
 *
 * @function Spring.SetAlly
 * @param firstAllyTeamID integer
 * @param secondAllyTeamID integer
 * @param ally boolean x * x
 * @return nil
 */
int LuaSyncedCtrl::SetAlly(lua_State* L)
`;

const b = `blah blah /*** boo */ blaz`;

function detail(s: string) {
  const result = [];
  lexer.reset(s);
  for (const entry of lexer) {
    result.push(`${entry.type} -> ${entry.text}`);
    // console.log(entry);
  }
  console.log(result.join("\n"));
}

function comments(s: string) {
  const result = [];
  lexer.reset(s);
  let block = false;
  for (const entry of lexer) {
    if (entry.type === "blockCommentEnd") {
      block = false;
    }
    if (block) {
      if (entry.type !== "indent") {
        result.push(entry.text);
      }
    }
    if (entry.type === "blockCommentStart") {
      block = true;
    }
  }
  console.log(result.join(""));
}

function array(s: string) {
  lexer.reset(s);
  console.log(JSON.stringify(Array.from(lexer)));
}

// detail(c);
console.log("----");
comments(c);

// array(c);
