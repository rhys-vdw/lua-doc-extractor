import Comments, { Comment, Tag } from "parse-comments";
const comments = new Comments();
import * as project from "../package.json";
import { remove, trimStart } from "lodash";

export function extract(path: string, source: string): string {
  return `
---!!! DO NOT MANUALLY EDIT THIS FILE !!!
---Generated by ${project.name} ${project.version}
---Date: ${new Date().toUTCString()}
---Source: ${path}
---
---@meta

${members(source)}`;
}

function toLuaComment(text: string): string {
  return text
    .trim()
    .split("\n")
    .map((line) => `---${trimStart(line, " *")}`)
    .join("\n");
}

function formatTag({ title, name, description }: Tag): string {
  return toLuaComment(
    "@" + [title, name, description].filter((s) => s.length > 0).join(" ")
  );
}

function members(source: string): string {
  const ast = comments.parse(source);
  const members = ast.reduce((acc, c) => {
    if (!c.value.startsWith("*")) {
      return acc;
    }
    const lua = extractDeclaration(c);
    const doc = `${toLuaComment(c.description)}\n---\n${c.tags
      .map(formatTag)
      .join("\n")}`;
    acc.push(lua == null ? doc : `${doc}\n${lua}`);
    return acc;
  }, [] as string[]);
  return members.join("\n\n");
}

function extractDeclaration(comment: Comment): string | null {
  // Remove all the @function tags.
  const funcs = remove(comment.tags, (t) => t.title === "function");

  if (funcs.length > 0) {
    const [func, ...rest] = funcs;
    if (rest.length > 0) {
      console.warn(
        `Multiple @function tags found in comment: ${
          comment.value
        }, ignoring: ${rest.map((t) => t.name).join(", ")}`
      );
    }
    const paramNames = comment.tags
      .filter((t) => t.title === "param")
      .map((t) => t.name);

    return `function ${func.name}(${paramNames.join(", ")}) end`;
  }

  return null;
}
