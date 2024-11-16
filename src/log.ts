import { red, yellow } from "chalk";

export function logError(message: string): void {
  console.error(red(message));
}

export function logWarning(message: string): void {
  console.warn(yellow(message));
}
