#!/usr/bin/env node

import chalk from "chalk";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import dedent from "dedent-js";
import { mkdir, readFile, writeFile } from "fs/promises";
import { basename, dirname, extname, join } from "path";
import { addHeader, formatDocs, getDocs, processDocs } from ".";
import project from "../package.json";
import { Doc } from "./doc";

interface Options {
  src: string[];
  dest: string;
  help: boolean;
  repo?: string;
  file?: string;
}
const optionList = [
  {
    name: "src",
    type: String,
    defaultOption: true,
    multiple: true,
    defaultValue: [],
    typeLabel: "{underline file} ...",
    description: "Files to extract lua doc from.\n",
  },
  {
    name: "dest",
    alias: "d",
    type: String,
    typeLabel: "{underline directory}",
    defaultValue: ".",
    description: '{white (Default: ".")} Directory to write lua output to.\n',
  },
  {
    name: "file",
    type: String,
    typeLabel: "{underline filename}",
    description:
      "If provided, all output will be written to a single file with this name.\n",
  },
  {
    name: "repo",
    type: String,
    typeLabel: "{underline url}",
    description: dedent`
      {white (Optional)} The root URL of a repository.

      If provided, links will be added to each generated doc comment with a link to the original source.

      Should be in format:

      {white "https://github.com/<user>/<repository>/blob/<commit>/"}

      `,
  },
  {
    name: "help",
    alias: "h",
    type: Boolean,
    description: "Print this usage guide.\n",
  },
];

const options = commandLineArgs(optionList) as Options;

function printUsage() {
  const usageNote = dedent`
    {bold.white Note:} Always run this command from the root of your project ensure correct paths in output headers and repo links.
  `;
  const examples = [
    "$ lua-doc-extractor file_a.cpp file_b.cpp",
    "$ lua-doc-extractor ---src src/*.cpp --dest output/lib.lua",
    "$ lua-doc-extractor *.cpp --repo https://github.com/user/proj/blob/12345c/",
  ];
  console.log(
    commandLineUsage([
      {
        header: `{white ${project.name} ${project.version}}`,
        content: project.description,
      },
      {
        header: "{white Usage}",
        content: [usageNote, ...examples].join("\n\n"),
      },
      { header: "{white Options}", optionList },
    ])
  );
}

function error(message: string) {
  console.error(chalk`{bold.rgb(255, 0, 0) ERROR:} ${message}`);
  printUsage();
  process.exit(1);
}

async function runAsync() {
  const { src, dest, help, repo, file } = options;

  if (help) {
    printUsage();
    process.exit(0);
  }

  if (src.length === 0) {
    error("No source files provided.");
  }

  const errors = [] as string[];
  console.log(chalk`{bold.underline Extracting docs:}\n`);
  const docs = await Promise.all(
    src.map(async (path) => {
      const [docResult, error] = getDocs(await readFile(path, "utf8"), path);

      if (error != null) {
        console.error(chalk`{bold.red ✘} '{white ${path}}'`);
        errors.push(chalk`'{white ${path}}': ${error}`);
        return [];
      }

      const [docs, docErrors] = docResult;

      if (docErrors.length > 0) {
        errors.push(...docErrors.map((e) => chalk`'{white ${path}}': ${e}`));
        console.log(chalk`{bold.yellow ⚠} '{white ${path}}'`);
      } else {
        console.log(chalk`{bold.green ✔} '{white ${path}}'`);
      }

      return [path, docs] as const;
    })
  );

  console.log(chalk`\n{bold.underline Writing output:}\n`);

  if (file === undefined) {
    // Multi-file output.
    await Promise.all(
      docs.map(async ([path, ds]) => {
        const outPath = join(dest, `${basename(path, extname(path))}.lua`);
        await writeLibraryFile(ds, outPath, repo, [path]);
      })
    );
  } else {
    // Single-file output.
    const outPath = join(dest, file);
    const sources = docs.map(([path]) => path);
    await writeLibraryFile(
      docs.flatMap(([, ds]) => ds),
      outPath,
      repo,
      sources
    );
  }

  console.log(chalk`\n{bold {green ✔} Done}\n`);

  if (errors.length > 0) {
    console.error(chalk`\n{red.underline ERRORS}\n\n${errors.join("\n")}`);
  }
}

async function writeLibraryFile(
  docs: Doc[],
  outPath: string,
  repo?: string,
  sources: string[] = []
) {
  try {
    const formattedDocs = formatDocs(processDocs(docs, repo ?? null));
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, addHeader(formattedDocs, sources));
    console.log(chalk`{bold.blue ►} '{white ${outPath}}'`);
  } catch (e) {
    console.error(
      chalk`{bold.rgb(255, 0, 0) ERROR:} Could not write '{white ${outPath}}'\n\n`,
      e
    );
    process.exit(1);
  }
}

runAsync();
