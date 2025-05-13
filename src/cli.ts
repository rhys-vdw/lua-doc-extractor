#!/usr/bin/env node

import chalk from "chalk";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import dedent from "dedent-js";
import { mkdir, readFile, writeFile } from "fs/promises";
import { glob } from "glob";
import { dirname, join, relative } from "path";
import { cwd } from "process";
import { addHeader, formatDocs, getDocs, processDocs } from ".";
import project from "../package.json";
import { Doc } from "./doc";
import { toResultAsync } from "./result";

interface Options {
  src: string[];
  dest: string;
  help: boolean;
  error?: boolean;
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
    description: "Files to extract lua doc from. Supports globs.\n",
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
    name: "error",
    type: Boolean,
    description:
      "{white (Default: false)} Return error code 1 if any errors or warnings are encountered.\n",
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
    '$ lua-doc-extractor ---src "src/**/*.\\{cpp,h\\}" --dest output/lib.lua',
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
  const { src, dest, help, repo, file, error: enableErrorCode } = options;

  if (help) {
    printUsage();
    process.exit(0);
  }

  const srcFiles = await glob(src);

  if (srcFiles.length === 0) {
    error("No source files provided.");
  }

  const errors = [] as string[];
  console.log(chalk`{bold.underline Extracting docs:}\n`);
  const processed = await Promise.all(
    srcFiles.map(async (path) => {
      const [file, fileError] = await toResultAsync(() =>
        readFile(path, "utf8")
      );

      if (fileError != null) {
        console.error(chalk`{bold.red ✘} '{white ${path}}'`);
        errors.push(chalk`'{white ${path}}': Error loading file: ${fileError}`);
        return null;
      }

      const [docResult, error] = getDocs(file, path);

      if (error != null) {
        console.error(chalk`{bold.red ✘} '{white ${path}}'`);
        errors.push(chalk`'{white ${path}}': ${error}`);
        return null;
      }

      const [docs, docErrors] = docResult;

      if (docErrors.length > 0) {
        errors.push(...docErrors.map((e) => chalk`'{white ${path}}': ${e}`));
        console.log(chalk`{bold.yellow ⚠} '{white ${path}}'`);
      } else if (docs.length === 0) {
        console.log(chalk`{bold.yellow -} {gray '${path}'}`);
      } else {
        const col = chalk`{bold.green ✔} '{white ${path}}'`;
        const count = `${docs.length}`;
        console.log(`${col.padEnd(80 - count.length - 1)} ${count}`);
      }

      return [path, docs] as const;
    })
  );

  const valid = processed.filter((e) => e != null);

  console.log(chalk`\n{bold.underline Writing output:}\n`);

  if (file === undefined) {
    // Multi-file output.
    await Promise.all(
      valid.map(async ([path, ds]) => {
        const rel = relative(cwd(), path);
        const outPath = join(dest, `${rel}.lua`);
        if (ds.length > 0) {
          await writeLibraryFile(ds, outPath, repo, [path]);
        }
      })
    );
  } else {
    // Single-file output.
    const outPath = join(dest, file);
    const sources = valid.map(([path]) => path);
    await writeLibraryFile(
      valid.flatMap(([, ds]) => ds),
      outPath,
      repo,
      sources
    );
  }

  console.log(chalk`\n{bold {green ✔} Done}\n`);

  if (errors.length > 0) {
    console.error(chalk`\n{red.underline ERRORS}\n\n${errors.join("\n")}`);
    if (enableErrorCode) {
      process.exit(1);
    }
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
