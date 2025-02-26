#!/usr/bin/env node

import chalk from "chalk";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { addHeader, formatDocs, getDocs, processDocs } from ".";
import project from "../package.json";

interface Options {
  src: string[];
  dest: string;
  help: boolean;
  repo?: string;
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
    defaultValue: "library.lua",
    description:
      '{white (Default: "library.lua")} Folder or file to write lua output to. Will be treated as a directory if it does not end in ".lua".\n',
  },
  {
    name: "repo",
    type: String,
    typeLabel: "{underline url}",
    description:
      '{white (Optional)} The root URL of a repository.\n\nIf provided, "@see" attributes will be added to each generated item with a link to the original source. Should be in format "https://github.com/<user>/<repository>/blob/<commit>/"\n',
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
  const examples = [
    "$ lua-doc-extractor file_a.cpp file_b.cpp",
    "$ lua-doc-extractor ---src src/**/*.cpp --dest output/lib.lua",
    "$ lua-doc-extractor *.cpp --repo https://github.com/user/proj/blob/12345c/",
  ];
  console.log(
    commandLineUsage([
      {
        header: `${project.name} ${project.version}`,
        content: project.description,
      },
      {
        header: "Usage",
        content: examples.join("\n\n"),
      },
      { header: "Options", optionList },
    ])
  );
}

function error(message: string) {
  console.error(chalk`{bold.rgb(255, 0, 0) ERROR:} ${message}`);
  printUsage();
  process.exit(1);
}

async function runAsync() {
  const { src, dest, help, repo } = options;

  if (help) {
    printUsage();
    process.exit(0);
  }

  if (src.length === 0) {
    error("No source files provided.");
  }

  const errors = [] as string[];
  console.log(chalk`{bold.underline Extracting docs:}\n`);
  const docs = (
    await Promise.all(
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

        return docs;
      })
    )
  ).flat();

  const formattedDocs = formatDocs(processDocs(docs, repo ?? null));
  const outPath = dest.endsWith(".lua") ? dest : join(dest, "library.lua");

  if (errors.length > 0) {
    console.error(chalk`\n{red.underline ERRORS}\n\n${errors.join("\n")}`);
  }

  console.log(chalk`\n{bold.underline Writing output:}\n`);

  try {
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, addHeader(formattedDocs));
    console.log(chalk`{bold.blue ►} '{white ${outPath}}'`);
    console.log(chalk`\n{bold {green ✔} Done}\n`);
  } catch (e) {
    console.error(
      chalk`{bold.rgb(255, 0, 0) ERROR:} Could not write '{white ${outPath}}'\n\n`,
      e
    );
    process.exit(1);
  }
}

runAsync();
