#!/usr/bin/env node
import { main } from "../src/cli/index.mjs";

main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = error.exitCode ?? 1;
});
