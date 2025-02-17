import moo, { Token } from "moo";
import { Position } from "./source";
import dedent from "dedent-js";

const lexer = moo.states({
  code: {
    newline: { match: "\n", lineBreaks: true },
    blockCommentStart: { match: "/***", push: "blockComment" },
    word: /[^\s]+/,
    space: /[ \t]+/,
  },
  blockComment: {
    newline: { match: "\n", lineBreaks: true },
    indent: /^\s+\*(?!\/)/,
    codeBlockStart: { match: /```[a-zA-Z]*/, push: "codeBlock" },
    blockCommentEnd: { match: "*/", pop: 1 },
    word: { match: /[^\s]+/ },
    space: /[ \t]+/,
  },
  codeBlock: {
    newline: { match: "\n", lineBreaks: true },
    indent: /^\s+\*(?!\/)/,
    codeBlockEnd: { match: "```", pop: 1 },
    word: /[^\s]+/,
    space: /[ \t]+/,
  },
});

const c = `
/*** Changes the value of the (one-sided) alliance between: firstAllyTeamID -> secondAllyTeamID.
 *
 * @function Spring.SetAlly
 * @param firstAllyTeamID integer
 * @param secondAllyTeamID integer
 * @param ally boolean
 * @return nil
 */
int LuaSyncedCtrl::SetAlly(lua_State* L)
{
	const int firstAllyTeamID = luaL_checkint(L, 1);
	const int secondAllyTeamID = luaL_checkint(L, 2);

	if (!teamHandler.IsValidAllyTeam(firstAllyTeamID))
		return 0;
	if (!teamHandler.IsValidAllyTeam(secondAllyTeamID))
		return 0;

	teamHandler.SetAlly(firstAllyTeamID, secondAllyTeamID, luaL_checkboolean(L, 3));
	return 0;
}


/*** Changes the start box position of an allyTeam.
 *
 * @function Spring.SetAllyTeamStartBox
 * @param allyTeamID integer
 * @param xMin number left start box boundary (elmos)
 * @param zMin number top start box boundary (elmos)
 * @param xMax number right start box boundary (elmos)
 * @param zMax number bottom start box boundary (elmos)
 *
 * \`\`\`lua
 * /***
 *   Nested comment here
 * */
 * \`\`\`
 * @return nil
 */
int LuaSyncedCtrl::SetAllyTeamStartBox(lua_State* L)
{
	const unsigned int allyTeamID = luaL_checkint(L, 1);
	const float xMin = luaL_checkfloat(L, 2);
	const float zMin = luaL_checkfloat(L, 3);
	const float xMax = luaL_checkfloat(L, 4);
	const float zMax = luaL_checkfloat(L, 5);
`;

const b = `blah blah /*** boo */ blaz`;

function detail(s: string) {
  const result = [];
  lexer.reset(s);
  for (const entry of lexer) {
    const t = `'${entry.text.replace("\t", "\\t")}'`;
    result.push(
      `${entry.type} -> ${t.padStart(15 + t.length - entry.type!.length)}`
    );
    // console.log(entry);
  }
  console.log(result.join("\n"));
}

export interface RawComment {
  start: Position;
  end: Position;
  text: string;
}

function comments(s: string) {
  const result = [] as RawComment[];
  let current = null as { text: string[]; start: Position } | null;

  lexer.reset(s);
  for (const entry of lexer) {
    // Check for end of comment.
    if (entry.type === "blockCommentEnd") {
      if (current === null) {
        console.error(
          `Encountered "${entry.text}" when not in a comment block: ${entry.line}:${entry.col}`
        );
      } else {
        console.log(entry);
        result.push({
          // NOTE: Add an extra empty line at the front, because dedent will not
          // de-indent the first line. It strips all leading newlines.
          text: dedent("\n" + current.text.join("")),
          start: current.start,
          end: {
            lineNumber: entry.line,
            columnNumber: entry.col + entry.text.length - 1,
          },
        });
        current = null;
      }
    }

    // Accumulate comment body.
    if (current !== null && entry.type !== "indent") {
      current.text.push(entry.text);
    }

    // Start a new comment.
    if (entry.type === "blockCommentStart") {
      if (current !== null) {
        console.error(
          `Encountered "${entry.text}" when in a comment block: ${entry.line}:${entry.col}`
        );
      } else {
        current = {
          text: [],
          start: { lineNumber: entry.line, columnNumber: entry.col },
        };
      }
    }
  }
  console.log(
    result
      .map(
        (r) =>
          `\n-------- ${r.start.lineNumber}:${r.start.columnNumber}-${r.end.lineNumber}:${r.end.columnNumber}\n${r.text}`
      )
      .join("")
  );
}

function array(s: string) {
  lexer.reset(s);
  console.log(JSON.stringify(Array.from(lexer)));
}

detail(c);
console.log("----");
comments(c);

// array(c);
