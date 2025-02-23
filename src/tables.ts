import { without } from "lodash";
import { Doc } from "./doc";
import { joinLines, splitFirstWord } from "./utility";

export function mergeTables(docs: Doc[]): Doc[] {
  const byTable = new Map<string, Doc>();
  const result = [] as Doc[];

  docs.forEach((doc) => {
    const tableAttr =
      doc.attributes.find((a) => a.type === "table") ||
      doc.attributes.find((a) => a.type === "enum");

    if (tableAttr != null) {
      // Get table name from the tag.
      const split = splitFirstWord(tableAttr);
      if (split != null) {
        const [table, detail] = split;
        if (byTable.has(table)) {
          const prev = byTable.get(table)!;

          // Merge descriptions with a blank line.
          prev.description = joinLines(prev.description, doc.description);

          // Merge in the additional detail from the table tag.
          prev.description = joinLines(prev.description, detail);

          // Merge all tags, but skip the duplicate table tag.
          prev.attributes.push(...without(doc.attributes, tableAttr));

          // Exit early to remove comment from list.
          return;
        } else {
          byTable.set(table, doc);
        }
      }
    }

    // If we didn't merge this comment into another.
    result.push(doc);
  });

  return result;
}
