import { createAttribute } from "./attribute";
import { Doc, filterAttributes, removeAttributes } from "./doc";
import { joinLines } from "./utility";

/**
 * Adds a table attribute to each standalone field that references an enum table.
 */
export function addTableToEnumFields(docs: Doc[]): Doc[] {
  // Collect all enum name.
  const enumNames = new Set<string>();
  docs
    .flatMap((doc) => filterAttributes(doc, "enum"))
    .forEach((attr) => {
      enumNames.add(attr.args.name);
    });

  // Process each enum field.
  docs.forEach((doc) => {
    const fields = filterAttributes(doc, "field");
    const tableNames = fields.reduce((acc, field) => {
      const { tables } = field.args;

      // This field has no table.
      if (tables.length === 0) {
        return acc;
      }

      // This field has too many tables.
      if (tables.length > 1) {
        return acc;
      }

      const tableName = tables[0].name;

      if (!enumNames.has(tableName)) {
        return acc;
      }

      // Remove the tables.
      field.args.tables = [];

      // Marge the leading description into the field.
      field.args.description = joinLines(
        field.args.description,
        doc.description
      );

      // Add to table names.
      acc.add(tableName);
      return acc;
    }, new Set<string>());

    if (tableNames.size > 0) {
      doc.description = "";
    }

    for (const tableName of tableNames) {
      // Add a table attribute so it can be merged later.
      doc.attributes.push(
        createAttribute("table", {
          isLocal: false,
          tables: [],
          name: tableName,
          description: "",
        })
      );
    }
  });

  return docs;
}

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
