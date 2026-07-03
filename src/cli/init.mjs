import fs from "node:fs/promises";
import path from "node:path";
import {
  dependencyInstallOperation,
  planDependencyInstall,
  preflightDependencyInstaller,
  runDependencyInstall,
} from "./dependency-installer.mjs";
import { renderClaudeHookSettings } from "./claude-hooks.mjs";
import { installStatePath, writeInstallState } from "./install-state.mjs";
import { collectManagedFileHashes, getManagedFiles } from "./managed-files.mjs";
import { DEFAULT_PACKAGE_MANAGER, detectPackageManager, validatePackageManager } from "./package-manager.mjs";
import { parseProfiles } from "./profile.mjs";
import { getProfileScripts, getProfileSupportScripts, splitGateScripts } from "./profile-scripts.mjs";
import { resolveWorkspace } from "./workspace.mjs";
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
  --review-templates   Copy PR template and AI code understanding worksheet.
  --install-deps       Install missing dev dependencies for generated package scripts.
  --workspace <pkg-dir> Target workspace package (relative path, single). Gate scripts
                       (ai:check*) go to the workspace root package.json; step scripts go
                       to the package. Cannot be combined with --install-deps.
  --dry-run            Print planned operations without writing files.
  --yes                Confirm non-interactive writes.
  --overwrite          Replace conflicting files/scripts.
  --json               Print machine-readable JSON output.`;

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
  if (!(await pathExists(packageJsonPath))) {
    throw new CliError(`Target project must contain package.json: ${packageJsonPath}`);
  }

  // SPEC-0061 PRE-01: all workspace validation (FR-02 / SEC-01 / SEC-02) is
  // completed here, before any write is planned or performed.
  const workspaceInfo = options.workspace
    ? await resolveWorkspace(targetDir, options.workspace)
    : null;
  const writeOptions = { ...options, packageManager, workspaceInfo };

  const dependencyInstallPlan = writeOptions.installDeps
    ? await planDependencyInstall(packageJsonPath, profile, writeOptions.packageManager)
    : null;

  if (dependencyInstallPlan && !writeOptions.dryRun) {
    preflightDependencyInstaller(dependencyInstallPlan, targetDir);
  }

  const operations = [];

  await mergePackageScripts(targetDir, packageJsonPath, profile, writeOptions, operations);
  await copyManagedFiles(targetDir, profile, writeOptions, operations);

  if (writeOptions.claudeHooks) {
    await mergeClaudeSettings(targetDir, writeOptions, operations);
    await createLocalRulesReadme(targetDir, writeOptions, operations);
  }

  await writeInitInstallState(targetDir, profile, writeOptions, operations);
  await maybeInstallDependencies(targetDir, dependencyInstallPlan, writeOptions, operations);

  if (writeOptions.json) {
    writeLine(
      io.stdout,
      JSON.stringify(
        {
          status: writeOptions.dryRun ? "dry-run" : "completed",
          target: targetDir,
          profile: profile.all.join("+"),
          packageManager: writeOptions.packageManager,
          ...(workspaceInfo ? { workspace: workspaceInfo.dir } : {}),
          operations,
        },
        null,
        2,
      ),
    );
    return;
  }

  writeLine(io.stdout, `ai-check-template init ${writeOptions.dryRun ? "dry-run" : "completed"}`);
  writeLine(io.stdout, `target: ${targetDir}`);
  writeLine(io.stdout, `profile: ${profile.all.join("+")}`);
  writeLine(io.stdout, `package-manager: ${writeOptions.packageManager}`);
  if (workspaceInfo) {
    writeLine(io.stdout, `workspace: ${workspaceInfo.dir}`);
  }
  for (const operation of operations) {
    writeLine(
      io.stdout,
      `${operation.action}: ${relativeTarget(targetDir, operation.targetPath)}${operation.reason ? ` (${operation.reason})` : ""}${operation.command ? ` [${operation.command}]` : ""}`,
    );
  }
}

function parseInitArgs(argv, cwd) {
  const options = {
    target: cwd,
    profile: "react-nextjs",
    packageManager: DEFAULT_PACKAGE_MANAGER,
    ci: "direct",
    claudeHooks: false,
    reviewTemplates: false,
    installDeps: false,
    dryRun: false,
    yes: false,
    overwrite: false,
    json: false,
    help: false,
    workspace: null,
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

    if (arg === "--review-templates") {
      options.reviewTemplates = true;
      continue;
    }

    if (arg === "--install-deps") {
      options.installDeps = true;
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

    if (arg === "--json") {
      options.json = true;
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

    if (arg.startsWith("--workspace=")) {
      setWorkspaceOption(options, arg.slice("--workspace=".length));
      continue;
    }

    if (arg === "--workspace") {
      setWorkspaceOption(options, readFlagValue(argv, (index += 1), arg));
      continue;
    }

    throw new CliError(`Unknown init option: ${arg}\n\n${INIT_USAGE}`);
  }

  if (!["direct", "reusable", "none"].includes(options.ci)) {
    throw new CliError("--ci must be one of: direct, reusable, none");
  }

  if (options.workspace && options.installDeps) {
    throw new CliError(
      "--workspace cannot be combined with --install-deps. "
        + "Install dev dependencies in the workspace package manually or via your package manager, "
        + "and use .ai-check.yaml to override run steps if needed.",
    );
  }

  return options;
}

// SPEC-0061 FR-01: --workspace accepts a single value only.
function setWorkspaceOption(options, value) {
  if (options.workspace !== null) {
    throw new CliError("--workspace can only be specified once (single workspace support)");
  }
  options.workspace = value;
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

async function mergePackageScripts(targetDir, packageJsonPath, profile, options, operations) {
  const expectedScripts = getProfileScripts(profile, {
    packageManager: options.packageManager,
    ...(options.workspaceInfo ? { workspace: options.workspaceInfo } : {}),
  });
  const supportScripts = getProfileSupportScripts(profile, { packageManager: options.packageManager });

  if (!options.workspaceInfo) {
    await mergeScriptsInto(packageJsonPath, expectedScripts, supportScripts, options, operations);
    return;
  }

  // SPEC-0061 FR-03 / FR-04: gate scripts (ai:check*) go to the workspace root
  // package.json; step scripts and support scripts go to the target package.
  const { gate, step } = splitGateScripts(expectedScripts);
  const packagePackageJsonPath = path.join(
    targetDir,
    ...options.workspaceInfo.dir.split("/"),
    "package.json",
  );

  await mergeScriptsInto(packageJsonPath, gate, {}, options, operations);
  await mergeScriptsInto(packagePackageJsonPath, step, supportScripts, options, operations);
}

async function mergeScriptsInto(packageJsonPath, expectedScripts, supportScripts, options, operations) {
  const packageJson = await readJson(packageJsonPath);
  const existingScripts = packageJson.scripts ?? {};
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

async function copyManagedFiles(targetDir, profile, options, operations) {
  for (const file of getManagedFiles({ ...options, profile })) {
    const targetPath = path.join(targetDir, file.relativePath);

    if (file.kind === "ci-workflow") {
      operations.push(await copyTextFileSafe(await file.render(), targetPath, options));
      continue;
    }

    const operation = await copyFileSafe(file.sourcePath, targetPath, options);
    operations.push(
      file.detail
        ? { ...operation, reason: operation.reason === "exists" ? `${file.detail} exists` : file.detail }
        : operation,
    );
  }
}

async function copyTextFileSafe(content, targetPath, options = {}) {
  const { dryRun = false, overwrite = false } = options;
  const exists = await pathExists(targetPath);

  if (exists && !overwrite) {
    return { action: "skip", reason: "exists", targetPath };
  }

  if (!dryRun) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, content);
  }

  if (exists && overwrite) {
    return { action: dryRun ? "would-overwrite" : "overwrite", targetPath };
  }

  return { action: dryRun ? "would-copy" : "copy", targetPath };
}

async function mergeClaudeSettings(targetDir, options, operations) {
  const targetPath = path.join(targetDir, ".claude", "settings.json");
  const fragment = renderClaudeHookSettings(
    await readJson(fromTemplates(".claude", "settings.hook-fragment.json")),
    options.packageManager,
  );
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

// Seed the installer-untouched overlay directory (.claude/rules/local/) with a
// usage README on --claude-hooks init. The README is written once: an existing
// README is skipped without touching its content (INV-05), and update/doctor
// never manage anything under local/ (FR-04 / FR-05).
async function createLocalRulesReadme(targetDir, options, operations) {
  const localDir = path.join(targetDir, ".claude", "rules", "local");
  const targetPath = path.join(localDir, "README.md");

  // The local path may already exist as a plain file: never destroy user
  // content, skip with an explanatory reason instead (SPEC-0057 想定エラー3).
  if (await pathExists(localDir)) {
    const stats = await fs.stat(localDir);

    if (!stats.isDirectory()) {
      operations.push({
        action: "skip",
        reason: ".claude/rules/local exists as a file; overlay README not written",
        targetPath,
      });
      return;
    }
  }

  if (await pathExists(targetPath)) {
    operations.push({ action: "skip", reason: "exists", targetPath });
    return;
  }

  if (!options.dryRun) {
    await fs.mkdir(localDir, { recursive: true });
    await fs.copyFile(fromTemplates(".claude", "rules", "local", "README.md"), targetPath);
  }

  operations.push({
    action: options.dryRun ? "would-create" : "create",
    reason: "overlay rules directory",
    targetPath,
  });
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

  const managedFileOptions = {
    profile,
    packageManager: options.packageManager,
    ci: options.ci,
    claudeHooks: options.claudeHooks,
    reviewTemplates: options.reviewTemplates,
  };

  await writeInstallState(
    targetDir,
    {
      ...managedFileOptions,
      // SPEC-0061 FR-05: the workspace field is only present in workspace mode.
      ...(options.workspaceInfo ? { workspace: options.workspaceInfo.dir } : {}),
      // Hash the files as written on disk so baselines stay truthful even for
      // files init skipped because they already existed (INV-02). Dry runs do
      // not read or record anything (INV-04).
      managedFiles: options.dryRun ? {} : await collectManagedFileHashes(targetDir, managedFileOptions),
    },
    { dryRun: options.dryRun },
  );
}

async function maybeInstallDependencies(targetDir, dependencyInstallPlan, options, operations) {
  if (!dependencyInstallPlan) {
    return;
  }

  const dependencyOperation = dependencyInstallOperation(dependencyInstallPlan, {
    dryRun: options.dryRun,
    path: "package.json",
  });
  operations.push({
    action: dependencyOperation.action,
    reason: dependencyOperation.detail,
    targetPath: path.join(targetDir, dependencyOperation.path),
    ...(dependencyOperation.command ? { command: dependencyOperation.command } : {}),
  });

  if (!options.dryRun) {
    runDependencyInstall(dependencyInstallPlan, targetDir);
  }
}

function relativeTarget(targetDir, targetPath) {
  return path.relative(targetDir, targetPath) || ".";
}
