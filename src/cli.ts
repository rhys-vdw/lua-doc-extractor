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
    "$ lua-doc-extractor ---src src/lua-files/**/*.cpp -dest output",
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
  const { src, dest, help } = options;

  if (help) {
    printUsage();
    process.exit(0);
  }

  if (src.length === 0) {
    error("No source files provided.");
  }

  await mkdir(dest, { recursive: true });
  await Promise.all(
    src.map(async (s) => {
      const output = extract(s, await readFile(s, "utf8"));
      const destPath = join(dest, `${basename(s, extname(s))}.lua`);
      await writeFile(destPath, output);
      console.log(`Generated ${destPath}`);
    })
  );
}

runAsync();
