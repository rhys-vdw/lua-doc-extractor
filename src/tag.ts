export interface Tag {
  type: string;
  detail: string[];
}

export function formatTag({ type, detail }: Readonly<Tag>): string {
  let result = `@${type}`;
  if (detail.length > 0) {
    result += ` ${detail.join("\n")}`;
  }
  return result;
}
