import { getComments } from "./comment";
import { Doc, formatDoc, isDocEmpty, parseDoc } from "./doc";
import { mergeEnumAttributes } from "./enum";
import { renderStandaloneFields } from "./field";
import { processGlobals } from "./global";
import { header } from "./header";
import { fail, Result, success } from "./result";
import { applyRules } from "./rules";
import { addTables, mergeTables } from "./tables";
import { trimTrailingWhitespace } from "./utility";

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
  return runProcessors(docs, [
    processGlobals,
    addTables,
    mergeTables,
    mergeEnumAttributes,
    renderStandaloneFields,
    applyRules,
  ]);
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
