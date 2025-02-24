import { getComments } from "./comment";
import { Doc, formatDoc, isDocEmpty, parseDoc } from "./doc";
import { header } from "./header";
import { logWarning } from "./log";
import { fail, Result, success } from "./result";
import { functionRule, globalRule, Rule, tableRule } from "./rules";
import { addTables, mergeTables } from "./tables";
import { formatAttribute, trimTrailingWhitespace } from "./utility";

export function addHeader(body: string): string {
  return `${header()}\n\n${body}`;
}

export function getDocs(
  source: string,
  path: string
): Result<[Doc[], Error[]]> {
  const [comments, error] = getComments(source);
  if (error != null) {
    return fail(error);
  }
  const docs = [] as Doc[];
  const docErrors = [] as Error[];
  comments.map(parseDoc).forEach(([doc, error]) => {
    if (error != null) {
      docErrors.push(error);
    } else {
      doc.path = path;
      docs.push(doc);
    }
  });
  return success([docs, docErrors]);
}

export type DocProcessor = (docs: Doc[]) => Doc[];

function runProcessors(docs: Doc[], processors: readonly DocProcessor[]) {
  return processors.reduce((acc, processor) => processor(acc), docs);
}

export function processDocs(docs: Doc[]): Doc[] {
  const processed = runProcessors(docs, [addTables, mergeTables]);
  processed.forEach(applyRules);
  return processed;
}

export function formatDocs(
  docs: Readonly<Doc[]>,
  repoUrl: string | null
): string {
  const members = docs
    .filter((e) => !isDocEmpty(e))
    .map((d) => formatDoc(d, repoUrl));

  return trimTrailingWhitespace(members.join("\n\n"));
}

const ruleHandlers = {
  global: globalRule,
  function: functionRule,
  table: tableRule,
} as Record<string, Rule | undefined>;

/**
 * Apply custom attribute rules, which may generate a declaration or remove tags
 * from the comment.
 * @return Lua declaration or null.
 */
function applyRules(doc: Doc): void {
  // Keep a copy of attributes so we can modify the original.
  const prevAttrs = [...doc.attributes];
  prevAttrs.forEach((t) => {
    const handler = ruleHandlers[t.type];
    if (handler != null) {
      handler(t, doc);
    }
  });

  if (doc.lua.length > 1) {
    logWarning(
      `Multiple generators found:\n - ${prevAttrs
        .map(formatAttribute)
        .join("\n - ")}`
    );
  }
}
