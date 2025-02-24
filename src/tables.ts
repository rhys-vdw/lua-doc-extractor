import { without } from "lodash";
import { TableAttribute } from "./attribute";
import { Doc, findAttribute } from "./doc";
import { joinLines, stripGenericParams } from "./utility";

export function addTables(docs: Doc[]): Doc[] {
  docs.forEach((doc) => {
    // No need to add a table tag if one already exists.
    if (findAttribute(doc, "table") != null) {
      return;
    }

    // Classes create a local table.
    const classAttr = findAttribute(doc, "class");
    if (classAttr != null) {
      const className = classAttr.class.name;
      const tableAttr: TableAttribute = {
        type: "table",
        table: { name: stripGenericParams(className), isLocal: true },
        description: "",
      };
      doc.attributes.push(tableAttr);
      return;
    }

    // Enums create a global table.
    const enumAttr = findAttribute(doc, "enum");
    if (enumAttr != null) {
      const enumName = enumAttr.enum.name;
      const tableAttr: TableAttribute = {
        type: "table",
        table: { name: enumName, isLocal: false },
        description: "",
      };
      doc.attributes.push(tableAttr);
      return;
    }
  });

  return docs;
}

export function mergeTables(docs: Doc[]): Doc[] {
  const byTable = new Map<string, Doc>();
  const result = [] as Doc[];

  docs.forEach((doc) => {
    const tableAttr = findAttribute(doc, "table");

    if (tableAttr != null) {
      const table = tableAttr.table.name;
      const detail = tableAttr.description;
      if (byTable.has(table)) {
        const prev = byTable.get(table)!;

        // Merge descriptions with a blank line.
        prev.description = joinLines(prev.description, doc.description);

        // Merge in the additional detail from the table tag.
        if (detail != null) {
          prev.description = joinLines(prev.description, detail);
        }

        // Merge all tags, but skip the duplicate table tag.
        prev.attributes.push(...without(doc.attributes, tableAttr));

        // Exit early to remove comment from list.
        return;
      } else {
        byTable.set(table, doc);
      }
    }

    // If we didn't merge this comment into another.
    result.push(doc);
  });

  return result;
}
