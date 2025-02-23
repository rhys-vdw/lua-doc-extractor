#!/usr/bin/env node

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import { addHeader, formatDocs, getDocs, processDocs } from ".";
import { readFile, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import project from "../package.json";
import chalk from "chalk";
import { header } from "./header";
import { trimTrailingWhitespace } from "./utility";

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
    description: "Files to extract lua doc from.",
  },
  {
    name: "dest",
    alias: "d",
    type: String,
    typeLabel: "{underline directory}",
    defaultValue: "library",
    description: "Folder to export lua library files to. (Default: 'library')",
  },
  {
    name: "repo",
    type: String,
    typeLabel: "{underline url}",
    description:
      "(Optional) The root URL of a repository.\n\nIf provided, `@see` attributes will be added to each generated item with a link to the original source. Should be in format `https://github.com/<user>/<repository>/blob/<commit>/`",
  },
  {
    name: "help",
    alias: "h",
    type: Boolean,
    description: "Print this usage guide.",
  },
];

const options = commandLineArgs(optionList) as Options;

function printUsage() {
  const examples = [
    "$ lua-doc-extractor file_a.cpp file_b.cpp",
    "$ lua-doc-extractor ---src src/lua-files/**/*.cpp --dest output",
    "$ lua-doc-extractor ---src src/**/*.cpp --dest output --repo https://github.com/user/project/blob/12345c/",
  ];
  console.log(
    commandLineUsage([
      {
        header: `${project.name} ${project.version}`,
        content: project.description,
      },
      {
        header: "Usage",
        content: examples.join("\n"),
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

  await mkdir(dest, { recursive: true });
  const errors = [] as string[];
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

  processDocs(docs);

  const formattedDocs = formatDocs(docs, repo ?? null);
  await writeFile(join(dest, "library.lua"), addHeader(formattedDocs));

  if (errors.length > 0) {
    console.error(chalk`\n{red.underline ERRORS}\n\n${errors.join("\n")}`);
  }
}

runAsync();
