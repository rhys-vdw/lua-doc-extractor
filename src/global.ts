import { createAttribute, FieldAttribute } from "./attribute";
import { Doc, removeAttributes } from "./doc";

export function processGlobals(docs: Doc[]): Doc[] {
  docs.forEach((doc) => {
    const globals = removeAttributes(doc, "global");
    const fields = globals.map(
      ({ args: { name, description } }): FieldAttribute =>
        createAttribute("field", { name, description }, {})
    );
    doc.attributes.push(...fields);
  });
  return docs;
}
