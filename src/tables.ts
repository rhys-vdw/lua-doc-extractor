import { without } from "lodash";
import { createAttribute } from "./attribute";
import { Doc, findAttribute } from "./doc";
import { joinLines } from "./utility";

export function addTables(docs: Doc[]): Doc[] {
  docs.forEach((doc) => {
    // No need to add a table tag if one already exists.
    if (findAttribute(doc, "table") != null) {
      return;
    }

    // Classes create a local table.
    const classAttr = findAttribute(doc, "class");
    if (classAttr != null) {
      const name = classAttr.args.type.name;
      const tableAttr = createAttribute("table", {
        isLocal: true,
        name,
        description: "",
      });
      doc.attributes.push(tableAttr);
      return;
    }

    // Enums create a global table.
    const enumAttr = findAttribute(doc, "enum");
    if (enumAttr != null) {
      const enumName = enumAttr.args.name;
      const tableAttr = createAttribute("table", {
        isLocal: false,
        name: enumName,
        description: "",
      });
      doc.attributes.push(tableAttr);
      return;
    }
  });

  return docs;
}

/**
 * Merge tables with the same name.
 */
export function mergeTables(docs: Doc[]): Doc[] {
  const byTable = new Map<string, Doc>();
  const result = [] as Doc[];

  docs.forEach((doc) => {
    const tableAttr = findAttribute(doc, "table");

    if (tableAttr != null) {
      const { args: table } = tableAttr;
      const key = table.name.join(".");
      if (byTable.has(key)) {
        const prev = byTable.get(key)!;

        // Merge descriptions with a blank line.
        prev.description = joinLines(prev.description, doc.description);

        // Merge in the additional detail from the table tag.
        prev.description = joinLines(prev.description, table.description);

        // Merge all tags, but skip the duplicate table tag.
        prev.attributes.push(...without(doc.attributes, tableAttr));

        // Exit early to remove comment from list.
        return;
      } else {
        byTable.set(key, doc);
      }
    }

    // If we didn't merge this comment into another.
    result.push(doc);
  });

  return result;
}
