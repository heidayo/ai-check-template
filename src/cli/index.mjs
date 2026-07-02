import { runDoctor } from "./doctor.mjs";
import { runExpect } from "./expect.mjs";
import { runInit } from "./init.mjs";
import { runStructuredCheck } from "./run.mjs";
import { runUpdate } from "./update.mjs";
import { CliError, writeLine } from "./utils.mjs";

const USAGE = `ai-check-template

Usage:
  ai-check-template --help
  ai-check-template init [options]
  ai-check-template doctor [options]
  ai-check-template update [options]
  ai-check-template run [options]
  ai-check-template expect [options]

Commands:
  doctor  Diagnose an existing ai-check-template installation.
  expect  Validate a structured AC/Test Matrix JSON or YAML file.
  init    Copy ai-check templates into an existing project.
  run     Execute a package script with structured PASS/FAIL/SKIPPED output.
  update  Update template-managed files in an existing installation.

Init options:
  --target <dir>       Target project directory. Defaults to the current directory.
  --profile <name>     Profile name. Defaults to react-nextjs.
  --package-manager <name> Package manager: pnpm, npm, yarn, or bun.
  --ci <mode>          CI mode: direct, reusable, or none. Defaults to direct.
  --claude-hooks       Copy Claude hook rule and merge hook settings.
  --review-templates   Copy PR template and AI code understanding worksheet.
  --install-deps       Install missing dev dependencies for generated package scripts.
  --dry-run            Print planned operations without writing files.
  --yes                Confirm non-interactive writes.
  --overwrite          Replace conflicting files/scripts.

Doctor options:
  --target <dir>       Target project directory. Defaults to the current directory.
  --package-manager <name> Package manager: pnpm, npm, yarn, or bun.
  --ci <mode>          CI mode to check: direct, reusable, or none. Defaults to direct.
  --claude-hooks       Check Claude rule and hook settings.
  --review-templates   Check PR template and AI code understanding worksheet.
  --strict             Treat warnings as failures.
  --json               Print machine-readable JSON output.

Update options:
  --target <dir>       Target project directory. Defaults to the current directory.
  --package-manager <name> Package manager: pnpm, npm, yarn, or bun.
  --ci <mode>          CI mode to update: direct, reusable, or none. Defaults to direct.
  --claude-hooks       Update Claude rule and hook settings.
  --review-templates   Update PR template and AI code understanding worksheet.
  --install-deps       Install missing dev dependencies for generated package scripts.
  --keep-local         Keep locally modified managed files (explicit default behavior).
  --force-managed      Overwrite locally modified managed files. A <file>.bak-<version> backup is written first.
  --diff               Print unified diffs for locally modified managed files without writing, and exit non-zero if any.
  --dry-run            Print planned operations without writing files.
  --yes                Confirm non-interactive writes.
  --json               Print machine-readable JSON output.

Run options:
  --target <dir>       Target project directory. Defaults to the current directory.
  --script <name>      Package script to run. Defaults to ai:check.
  --json               Print machine-readable JSON output.
  --output <file>      Write the JSON result to a file.

Expect options:
  --file <path>        JSON or template-subset YAML AC/Test Matrix file.
  --json               Print machine-readable JSON output.

Examples:
  ai-check-template init --target . --profile react-nextjs --review-templates --yes
  ai-check-template init --target . --profile react-nextjs+supabase-rls --ci reusable --dry-run
  ai-check-template doctor --target . --ci direct --json
  ai-check-template update --target . --ci direct --dry-run
  ai-check-template run --target . --script ai:check --json
  ai-check-template expect --file docs/ai-check-template/docs/ac-test-matrix.example.json --json`;

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

  if (command === "update") {
    await runUpdate(args, io);
    return;
  }

  if (command === "run") {
    await runStructuredCheck(args, io);
    return;
  }

  if (command === "expect") {
    await runExpect(args, io);
    return;
  }

  throw new CliError(`Unknown command: ${command}\n\n${USAGE}`, 1);
}
