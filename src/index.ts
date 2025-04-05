import { getComments } from "./comment";
import { Doc, formatDoc, getDoc, isDocEmpty, removeEmptyDocs } from "./doc";
import { addTableToEnumFields, mergeEnumAttributes } from "./enum";
import { renderStandaloneFields } from "./field";
import { processGlobals } from "./global";
import { header } from "./header";
import { fail, Result, success } from "./result";
import { applyRules } from "./rules";
import { appendSourceLinks } from "./source";
import { addTables, mergeTables } from "./tables";
import { trimTrailingWhitespace } from "./utility";

export function addHeader(body: string, sources: string[]): string {
  return `${header(sources)}\n\n${body}`;
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
  comments.map(getDoc).forEach(([doc, error]) => {
    if (error != null) {
      docErrors.push(error);
    } else if (!isDocEmpty(doc)) {
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

export function processDocs(docs: Doc[], repoUrl: string | null): Doc[] {
  return runProcessors(docs, [
    removeEmptyDocs,
    appendSourceLinks(repoUrl),
    processGlobals,
    addTables,
    addTableToEnumFields,
    mergeTables,
    mergeEnumAttributes,
    renderStandaloneFields,
    applyRules,
  ]);
}

export function formatDocs(docs: Readonly<Doc[]>): string {
  const members = docs.map(formatDoc).join("\n\n");
  return trimTrailingWhitespace(members);
}
