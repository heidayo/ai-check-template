import fs from "node:fs/promises";
import path from "node:path";
import { installStatePath, writeInstallState } from "./install-state.mjs";
import { DEFAULT_PACKAGE_MANAGER, detectPackageManager, validatePackageManager } from "./package-manager.mjs";
import { parseProfiles } from "./profile.mjs";
import { getProfileScripts, getProfileSupportScripts } from "./profile-scripts.mjs";
import {
  CliError,
  copyFileSafe,
  fromTemplates,
  pathExists,
  readJson,
  resolveTarget,
  writeJson,
  writeLine,
} from "./utils.mjs";

const INIT_USAGE = `ai-check-template init

Usage:
  ai-check-template init --target <dir> --profile <name> --yes [options]

Options:
  --target <dir>       Target project directory. Defaults to the current directory.
  --profile <name>     Base profile, optionally with +supabase-rls. Defaults to react-nextjs.
  --package-manager <name> Package manager: pnpm, npm, yarn, or bun. Defaults to target detection.
  --ci <mode>          CI mode: direct, reusable, or none. Defaults to direct.
  --claude-hooks       Copy Claude hook rule and merge hook settings.
  --dry-run            Print planned operations without writing files.
  --yes                Confirm non-interactive writes.
  --overwrite          Replace conflicting files/scripts.`;

const DIRECT_CI_FILES = ["ai-check.yml", "ai-check-fast.yml"];
const REUSABLE_CI_FILES = ["ai-quality-reusable.yml", "ai-quality-call.yml"];

export async function runInit(argv, io = {}) {
  const options = parseInitArgs(argv, io.cwd ?? process.cwd());

  if (options.help) {
    writeLine(io.stdout, INIT_USAGE);
    return;
  }

  if (!options.yes && !options.dryRun) {
    throw new CliError("Refusing to write without --yes. Use --dry-run to preview.");
  }

  const profile = parseProfiles(options.profile);
  const targetDir = await normalizeTargetDir(options.target);
  const packageJsonPath = path.join(targetDir, "package.json");
  const packageManager = options.explicit.packageManager
    ? options.packageManager
    : await detectPackageManager(targetDir);
  const writeOptions = { ...options, packageManager };

  if (!(await pathExists(packageJsonPath))) {
    throw new CliError(`Target project must contain package.json: ${packageJsonPath}`);
  }

  const operations = [];

  await mergePackageScripts(packageJsonPath, profile, writeOptions, operations);
  await copyScripts(targetDir, writeOptions, operations);
  await copyCiFiles(targetDir, writeOptions, operations);

  if (writeOptions.claudeHooks) {
    await copyClaudeHooks(targetDir, writeOptions, operations);
  }

  await writeInitInstallState(targetDir, profile, writeOptions, operations);

  writeLine(io.stdout, `ai-check-template init ${writeOptions.dryRun ? "dry-run" : "completed"}`);
  writeLine(io.stdout, `target: ${targetDir}`);
  writeLine(io.stdout, `profile: ${profile.all.join("+")}`);
  writeLine(io.stdout, `package-manager: ${writeOptions.packageManager}`);
  for (const operation of operations) {
    writeLine(io.stdout, `${operation.action}: ${relativeTarget(targetDir, operation.targetPath)}${operation.reason ? ` (${operation.reason})` : ""}`);
  }
}

function parseInitArgs(argv, cwd) {
  const options = {
    target: cwd,
    profile: "react-nextjs",
    packageManager: DEFAULT_PACKAGE_MANAGER,
    ci: "direct",
    claudeHooks: false,
    dryRun: false,
    yes: false,
    overwrite: false,
    help: false,
    explicit: {
      packageManager: false,
    },
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--claude-hooks") {
      options.claudeHooks = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--yes") {
      options.yes = true;
      continue;
    }

    if (arg === "--overwrite") {
      options.overwrite = true;
      continue;
    }

    if (arg.startsWith("--target=")) {
      options.target = resolveTarget(arg.slice("--target=".length), cwd);
      continue;
    }

    if (arg === "--target") {
      options.target = resolveTarget(readFlagValue(argv, (index += 1), arg), cwd);
      continue;
    }

    if (arg.startsWith("--profile=")) {
      options.profile = arg.slice("--profile=".length);
      continue;
    }

    if (arg === "--profile") {
      options.profile = readFlagValue(argv, (index += 1), arg);
      continue;
    }

    if (arg.startsWith("--package-manager=")) {
      options.packageManager = validatePackageManager(arg.slice("--package-manager=".length));
      options.explicit.packageManager = true;
      continue;
    }

    if (arg === "--package-manager") {
      options.packageManager = validatePackageManager(readFlagValue(argv, (index += 1), arg));
      options.explicit.packageManager = true;
      continue;
    }

    if (arg.startsWith("--ci=")) {
      options.ci = arg.slice("--ci=".length);
      continue;
    }

    if (arg === "--ci") {
      options.ci = readFlagValue(argv, (index += 1), arg);
      continue;
    }

    throw new CliError(`Unknown init option: ${arg}\n\n${INIT_USAGE}`);
  }

  if (!["direct", "reusable", "none"].includes(options.ci)) {
    throw new CliError("--ci must be one of: direct, reusable, none");
  }

  return options;
}

function readFlagValue(argv, index, flagName) {
  const value = argv[index];

  if (!value || value.startsWith("--")) {
    throw new CliError(`Missing value for ${flagName}`);
  }

  return value;
}

async function normalizeTargetDir(target) {
  const resolved = path.resolve(target);

  try {
    return await fs.realpath(resolved);
  } catch (error) {
    throw new CliError(`Target directory does not exist: ${resolved}\n${error.message}`);
  }
}

async function mergePackageScripts(packageJsonPath, profile, options, operations) {
  const packageJson = await readJson(packageJsonPath);
  const existingScripts = packageJson.scripts ?? {};
  const expectedScripts = getProfileScripts(profile, { packageManager: options.packageManager });
  const supportScripts = getProfileSupportScripts(profile);
  const nextScripts = { ...existingScripts };
  let changed = false;

  for (const [name, command] of Object.entries(expectedScripts)) {
    if (existingScripts[name] === command) {
      operations.push({ action: "keep", reason: "same script", targetPath: packageJsonPath });
      continue;
    }

    if (existingScripts[name] && !options.overwrite) {
      operations.push({ action: "skip", reason: `script ${name} exists`, targetPath: packageJsonPath });
      continue;
    }

    nextScripts[name] = command;
    changed = true;
    operations.push({
      action: existingScripts[name]
        ? options.dryRun
          ? "would-overwrite"
          : "overwrite"
        : options.dryRun
          ? "would-merge"
          : "merge",
      reason: `script ${name}`,
      targetPath: packageJsonPath,
    });
  }

  for (const [name, command] of Object.entries(supportScripts)) {
    if (nextScripts[name]) {
      operations.push({ action: "keep", reason: `support script ${name}`, targetPath: packageJsonPath });
      continue;
    }

    nextScripts[name] = command;
    changed = true;
    operations.push({
      action: options.dryRun ? "would-merge" : "merge",
      reason: `support script ${name}`,
      targetPath: packageJsonPath,
    });
  }

  if (changed) {
    packageJson.scripts = nextScripts;
    await writeJson(packageJsonPath, packageJson, { dryRun: options.dryRun });
  }
}

async function copyScripts(targetDir, options, operations) {
  for (const fileName of ["ai-check.sh", "ai-check-fast.sh"]) {
    operations.push(
      await copyFileSafe(
        fromTemplates("scripts", fileName),
        path.join(targetDir, "scripts", fileName),
        options,
      ),
    );
  }
}

async function copyCiFiles(targetDir, options, operations) {
  const files = options.ci === "direct"
    ? DIRECT_CI_FILES
    : options.ci === "reusable"
      ? REUSABLE_CI_FILES
      : [];

  for (const fileName of files) {
    operations.push(
      await copyFileSafe(
        fromTemplates("ci-examples", "github-actions", fileName),
        path.join(targetDir, ".github", "workflows", fileName),
        options,
      ),
    );
  }
}

async function copyClaudeHooks(targetDir, options, operations) {
  operations.push(
    await copyFileSafe(
      fromTemplates(".claude", "rules", "test-rules.md"),
      path.join(targetDir, ".claude", "rules", "test-rules.md"),
      options,
    ),
  );

  await mergeClaudeSettings(targetDir, options, operations);
}

async function mergeClaudeSettings(targetDir, options, operations) {
  const targetPath = path.join(targetDir, ".claude", "settings.json");
  const fragment = await readJson(fromTemplates(".claude", "settings.hook-fragment.json"));
  const settings = (await pathExists(targetPath)) ? await readJson(targetPath) : {};
  const nextSettings = { ...settings, hooks: { ...(settings.hooks ?? {}) } };
  let changed = false;

  for (const [name, hooks] of Object.entries(fragment.hooks ?? {})) {
    if (nextSettings.hooks[name] && !options.overwrite) {
      operations.push({ action: "skip", reason: `Claude hook ${name} exists`, targetPath });
      continue;
    }

    nextSettings.hooks[name] = hooks;
    changed = true;
    operations.push({
      action: nextSettings.hooks[name] && settings.hooks?.[name]
        ? options.dryRun
          ? "would-overwrite"
          : "overwrite"
        : options.dryRun
          ? "would-merge"
          : "merge",
      reason: `Claude hook ${name}`,
      targetPath,
    });
  }

  if (changed) {
    await writeJson(targetPath, nextSettings, { dryRun: options.dryRun });
  }
}

async function writeInitInstallState(targetDir, profile, options, operations) {
  const targetPath = installStatePath(targetDir);
  const exists = await pathExists(targetPath);
  operations.push({
    action: exists
      ? options.dryRun
        ? "would-update"
        : "update"
      : options.dryRun
        ? "would-create"
        : "create",
    reason: "install state",
    targetPath,
  });

  await writeInstallState(
    targetDir,
    {
      profile,
      packageManager: options.packageManager,
      ci: options.ci,
      claudeHooks: options.claudeHooks,
    },
    { dryRun: options.dryRun },
  );
}

function relativeTarget(targetDir, targetPath) {
  return path.relative(targetDir, targetPath) || ".";
}
