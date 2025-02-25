import { Doc, removeAttributes } from "./doc";
import { joinLines } from "./utility";

/**
 * Merges all enum attributes on each doc into a single attribute.
 * This should be run after tables are merged.
 */
export function mergeEnumAttributes(docs: Doc[]): Doc[] {
  docs.forEach((doc) => {
    // Remove all enum attributes.
    const enumAttrs = removeAttributes(doc, "enum");

    // Skip if this is not an enum.
    if (enumAttrs.length === 0) {
      return;
    }

    const [first, ...rest] = enumAttrs;

    // Append any additional description to the first enum.
    rest.forEach((attr) => {
      first.args.description = joinLines(
        first.args.description,
        attr.args.description
      );
    });

    // Insert the single enum back in.
    doc.attributes.unshift(first);
  });

  return docs;
}
