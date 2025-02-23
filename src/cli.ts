#!/usr/bin/env node

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import { extract } from ".";
import { readFile, mkdir, writeFile } from "fs/promises";
import { basename, extname, join } from "path";
import project from "../package.json";
import chalk from "chalk";

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
  await Promise.all(
    src.map(async (path) => {
      const [luaResult, error] = extract(
        path,
        await readFile(path, "utf8"),
        repo
      );
      const destPath = join(dest, `${basename(path, extname(path))}.lua`);
      if (error != null) {
        console.error(chalk`{bold.red ✘} '{white ${destPath}}'`);
        errors.push(chalk`'{white ${path}}': ${error}`);
        return;
      }

      const { lua, docErrors } = luaResult;

      errors.push(...docErrors.map((e) => chalk`'{white ${path}}': ${e}`));

      await writeFile(destPath, lua);
      if (docErrors.length > 0) {
        console.log(chalk`{bold.yellow ⚠} '{white ${destPath}}'`);
      } else {
        console.log(chalk`{bold.green ✔} '{white ${destPath}}'`);
      }
      return null;
    })
  );
  if (errors.length > 0) {
    console.error(chalk`\n{red.underline ERRORS}\n\n${errors.join("\n")}`);
  }
}

runAsync();
