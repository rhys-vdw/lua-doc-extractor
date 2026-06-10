import { Doc } from "./doc";

export interface FileOutput {
  name: string;
  docs: Doc[];
  sources: string[];
  preamble: string;
}

export function mergeFileOutputs(
  outputs: FileOutput[],
  fileName: string,
): FileOutput[] {
  return [{
    name: fileName,
    docs: outputs.flatMap((o) => o.docs),
    sources: [...new Set(outputs.flatMap((o) => o.sources))],
    preamble: outputs.map((o) => o.preamble).filter(Boolean).join("\n\n"),
  }];
}
