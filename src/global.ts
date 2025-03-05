import { createAttribute } from "./attribute";
import { Doc, removeAttributes } from "./doc";

export function processGlobals(docs: Doc[]): Doc[] {
  docs.forEach((doc) => {
    const globals = removeAttributes(doc, "global");
    const fields = globals.map(({ args, options }) =>
      createAttribute("field", args, options)
    );
    doc.attributes.push(...fields);
  });
  return docs;
}
