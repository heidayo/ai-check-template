import { runDoctor } from "./doctor.mjs";
import { runInit } from "./init.mjs";
import { CliError, writeLine } from "./utils.mjs";

const USAGE = `ai-check-template

Usage:
  ai-check-template --help
  ai-check-template init [options]
  ai-check-template doctor [options]

Commands:
  doctor  Diagnose an existing ai-check-template installation.
  init    Copy ai-check templates into an existing project.

Init options:
  --target <dir>       Target project directory. Defaults to the current directory.
  --profile <name>     Profile name. Defaults to react-nextjs.
  --ci <mode>          CI mode: direct, reusable, or none. Defaults to direct.
  --claude-hooks       Copy Claude hook rule and merge hook settings.
  --dry-run            Print planned operations without writing files.
  --yes                Confirm non-interactive writes.
  --overwrite          Replace conflicting files/scripts.

Doctor options:
  --target <dir>       Target project directory. Defaults to the current directory.
  --ci <mode>          CI mode to check: direct, reusable, or none. Defaults to direct.
  --claude-hooks       Check Claude rule and hook settings.
  --json               Print machine-readable JSON output.

Examples:
  ai-check-template init --target . --profile react-nextjs --yes
  ai-check-template init --target . --profile react-nextjs+supabase-rls --ci reusable --dry-run
  ai-check-template doctor --target . --ci direct --json`;

export async function main(argv = process.argv.slice(2), io = {}) {
  const args = [...argv];

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    writeLine(io.stdout, USAGE);
    return;
  }

  const command = args.shift();

  if (command === "init") {
    await runInit(args, io);
    return;
  }

  if (command === "doctor") {
    await runDoctor(args, io);
    return;
  }

  throw new CliError(`Unknown command: ${command}\n\n${USAGE}`, 1);
}
