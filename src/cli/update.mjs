import fs from "node:fs/promises";
import path from "node:path";
import {
  ciWorkflowRelativePath,
  inactiveCiWorkflowFiles,
  isManagedCiWorkflowContent,
} from "./ci-workflows.mjs";
import {
  dependencyInstallOperation,
  planDependencyInstall,
  preflightDependencyInstaller,
  runDependencyInstall,
} from "./dependency-installer.mjs";
import { mergeRenderedClaudeHookEntries, renderClaudeHookSettings } from "./claude-hooks.mjs";
import {
  assertWritableInstallState,
  effectiveOptionsSummary,
  installationSummary,
  installStatePath,
  loadInstallState,
  resolveEffectiveOptions,
  validateCiMode,
  writeInstallState,
} from "./install-state.mjs";
import { collectManagedFileHashes, getManagedFiles, hashContent } from "./managed-files.mjs";
import { DEFAULT_PACKAGE_MANAGER, detectPackageManager, validatePackageManager } from "./package-manager.mjs";
import { getProfileScripts, getProfileSupportScripts } from "./profile-scripts.mjs";
import {
  CliError,
  fromTemplates,
  pathExists,
  readJson,
  repoRoot,
  resolveTarget,
  writeJson,
  writeLine,
} from "./utils.mjs";

const UPDATE_USAGE = `ai-check-template update

Usage:
  ai-check-template update --target <dir> --yes [options]

Options:
  --target <dir>       Target project directory. Defaults to the current directory.
  --profile <name>     Profile to refresh in install state. Defaults to install state or react-nextjs.
  --package-manager <name> Package manager: pnpm, npm, yarn, or bun. Defaults to install state or target detection.
  --ci <mode>          CI mode to update: direct, reusable, or none. Defaults to direct.
  --claude-hooks       Update Claude rule and hook settings.
  --review-templates   Update PR template and AI code understanding worksheet.
  --install-deps       Install missing dev dependencies for generated package scripts.
  --keep-local         Keep locally modified managed files (explicit default behavior).
  --force-managed      Overwrite locally modified managed files. A <file>.bak-<version> backup is written first.
  --diff               Print unified diffs for locally modified managed files without writing, and exit non-zero if any.
  --dry-run            Print planned operations without writing files.
  --yes                Confirm non-interactive writes.
  --json               Print machine-readable JSON output.`;

export async function runUpdate(argv, io = {}) {
  const options = parseUpdateArgs(argv, io.cwd ?? process.cwd());

  if (options.help) {
    writeLine(io.stdout, UPDATE_USAGE);
    return;
  }

  if (!options.yes && !options.dryRun && !options.diff) {
    throw new CliError("Refusing to write without --yes. Use --dry-run to preview.");
  }

  const targetDir = await normalizeTargetDir(options.target);
  const packageJsonPath = path.join(targetDir, "package.json");

  if (!(await pathExists(packageJsonPath))) {
    throw new CliError(`Target project must contain package.json: ${packageJsonPath}`);
  }

  options.packageManager = options.explicit.packageManager
    ? options.packageManager
    : await detectPackageManager(targetDir);
  const installState = await loadInstallState(targetDir);
  assertWritableInstallState(installState);
  const effectiveOptions = resolveEffectiveOptions(options, installState);
  const writeOptions = {
    ...options,
    // --diff is a read-only reporting mode: no files or state are written.
    dryRun: options.dryRun || options.diff,
    profile: effectiveOptions.profile,
    packageManager: effectiveOptions.packageManager,
    ci: effectiveOptions.ci,
    claudeHooks: effectiveOptions.claudeHooks,
    reviewTemplates: effectiveOptions.reviewTemplates,
  };
  const dependencyInstallPlan = writeOptions.installDeps
    ? await planDependencyInstall(packageJsonPath, writeOptions.profile, writeOptions.packageManager)
    : null;

  if (dependencyInstallPlan && !writeOptions.dryRun) {
    preflightDependencyInstaller(dependencyInstallPlan, targetDir);
  }

  const operations = [];
  const cliPackageJson = await readJson(path.join(repoRoot, "package.json"));
  const context = {
    baseline: installState.state?.managedFiles ?? {},
    packageVersion: cliPackageJson.version ?? "0.0.0",
    modified: [],
    forcedBackups: [],
  };

  await updatePackageScripts(targetDir, packageJsonPath, writeOptions, operations);
  await updateManagedFiles(targetDir, writeOptions, operations, context);
  await cleanupInactiveCi(targetDir, writeOptions, operations);

  if (writeOptions.claudeHooks) {
    await updateClaudeSettings(targetDir, writeOptions, operations);
  }

  await updateInstallState(targetDir, effectiveOptions, writeOptions, operations, context);
  await maybeInstallDependencies(targetDir, dependencyInstallPlan, writeOptions, operations);

  const output = {
    status: options.diff ? "diff" : options.dryRun ? "dry-run" : "updated",
    target: targetDir,
    installation: installationSummary(installState),
    effectiveOptions: effectiveOptionsSummary(effectiveOptions),
    operations,
    notes: buildUpdateNotes(options, context),
    ...(options.diff
      ? { diffs: context.modified.map((entry) => ({ path: entry.relativePath, diff: unifiedDiff(entry) })) }
      : {}),
  };

  if (options.json) {
    writeLine(io.stdout, JSON.stringify(output, null, 2));
  } else {
    writeHumanOutput(io.stdout, output);

    if (options.diff) {
      for (const diffEntry of output.diffs) {
        writeLine(io.stdout, diffEntry.diff);
      }
    }
  }

  if (options.diff && context.modified.length > 0) {
    throw new CliError(`update --diff found ${context.modified.length} locally modified managed file(s)`, 1);
  }
}

function buildUpdateNotes(options, context) {
  const notes = [];

  if (context.modified.length > 0 && !options.diff && !options.forceManaged) {
    notes.push(
      `${context.modified.length} managed file(s) have local changes and were kept (skip-modified). `
        + `Keep them (default, or explicit --keep-local), inspect differences with --diff, `
        + `or overwrite them with --force-managed (a .bak-${context.packageVersion} backup is written first).`,
    );
  }

  if (context.forcedBackups.length > 0) {
    notes.push(
      `Backups written before forced overwrite: ${context.forcedBackups.join(", ")}. `
        + `Backup files may contain secrets; consider adding "*.bak-*" to .gitignore and do not commit them.`,
    );
  }

  return notes;
}

function parseUpdateArgs(argv, cwd) {
  const options = {
    target: cwd,
    profile: "react-nextjs",
    packageManager: DEFAULT_PACKAGE_MANAGER,
    ci: "direct",
    claudeHooks: false,
    reviewTemplates: false,
    installDeps: false,
    keepLocal: false,
    forceManaged: false,
    diff: false,
    dryRun: false,
    yes: false,
    json: false,
    help: false,
    explicit: {
      profile: false,
      packageManager: false,
      ci: false,
      claudeHooks: false,
      reviewTemplates: false,
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
      options.explicit.claudeHooks = true;
      continue;
    }

    if (arg === "--review-templates") {
      options.reviewTemplates = true;
      options.explicit.reviewTemplates = true;
      continue;
    }

    if (arg === "--install-deps") {
      options.installDeps = true;
      continue;
    }

    if (arg === "--keep-local") {
      options.keepLocal = true;
      continue;
    }

    if (arg === "--force-managed") {
      options.forceManaged = true;
      continue;
    }

    if (arg === "--diff") {
      options.diff = true;
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
      options.explicit.profile = true;
      continue;
    }

    if (arg === "--profile") {
      options.profile = readFlagValue(argv, (index += 1), arg);
      options.explicit.profile = true;
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
      options.explicit.ci = true;
      continue;
    }

    if (arg === "--ci") {
      options.ci = readFlagValue(argv, (index += 1), arg);
      options.explicit.ci = true;
      continue;
    }

    throw new CliError(`Unknown update option: ${arg}\n\n${UPDATE_USAGE}`);
  }

  validateCiMode(options.ci);

  if (options.keepLocal && options.forceManaged) {
    throw new CliError("--keep-local and --force-managed are mutually exclusive");
  }

  if (options.diff && (options.keepLocal || options.forceManaged)) {
    throw new CliError("--diff cannot be combined with --keep-local or --force-managed");
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

async function updatePackageScripts(targetDir, packageJsonPath, options, operations) {
  const packageJson = await readJson(packageJsonPath);
  const existingScripts = packageJson.scripts ?? {};
  const expectedScripts = getProfileScripts(options.profile, { packageManager: options.packageManager });
  const supportScripts = getProfileSupportScripts(options.profile, { packageManager: options.packageManager });
  const nextScripts = { ...existingScripts };
  let changed = false;

  for (const [name, expected] of Object.entries(expectedScripts)) {
    const current = existingScripts[name];
    const relativePath = "package.json";

    if (current === expected) {
      operations.push(operation("keep", relativePath, `script ${name}`));
      continue;
    }

    nextScripts[name] = expected;
    changed = true;
    operations.push(
      operation(
        current ? (options.dryRun ? "would-update" : "update") : (options.dryRun ? "would-create" : "create"),
        relativePath,
        `script ${name}`,
      ),
    );
  }

  for (const [name, expected] of Object.entries(supportScripts)) {
    const current = nextScripts[name];
    const relativePath = "package.json";

    if (current) {
      operations.push(operation("keep", relativePath, `support script ${name}`));
      continue;
    }

    nextScripts[name] = expected;
    changed = true;
    operations.push(
      operation(options.dryRun ? "would-create" : "create", relativePath, `support script ${name}`),
    );
  }

  if (changed && !options.dryRun) {
    packageJson.scripts = nextScripts;
    await writeJson(packageJsonPath, packageJson);
  }
}

async function updateManagedFiles(targetDir, options, operations, context) {
  for (const file of getManagedFiles(options)) {
    await applyManagedFileUpdate(targetDir, file, options, operations, context);
  }
}

// 3-way resolution per managed file (SPEC-0056 FR-02..FR-04):
// - local == upstream          -> keep (the baseline hash is refreshed on completion)
// - local == baseline          -> update to upstream
// - local differs from both    -> skip-modified by default, overwrite-forced with --force-managed
// - no baseline hash recorded  -> byte-comparison fallback; differences are kept, never overwritten silently
async function applyManagedFileUpdate(targetDir, file, options, operations, context) {
  const relativePath = normalizeRelative(file.relativePath);
  const targetPath = path.join(targetDir, file.relativePath);
  const expected = await file.render();
  const baselineHash = context.baseline[relativePath]?.hash ?? null;

  if (!(await pathExists(targetPath))) {
    // A tracked file was deleted locally (or never installed): regenerate it.
    operations.push(
      operation(
        options.dryRun ? "would-create" : "create",
        relativePath,
        baselineHash ? "missing managed file" : file.detail,
      ),
    );

    if (!options.dryRun) {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, expected);
    }
    return;
  }

  const actual = await fs.readFile(targetPath, "utf8");

  if (actual === expected) {
    operations.push(operation("keep", relativePath, file.detail));
    return;
  }

  if (baselineHash && hashContent(actual) === baselineHash) {
    operations.push(operation(options.dryRun ? "would-update" : "update", relativePath, file.detail));

    if (!options.dryRun) {
      await fs.writeFile(targetPath, expected);
    }
    return;
  }

  // Local content differs from upstream and from the baseline (or no baseline
  // exists to compare against). Never overwrite without --force-managed (INV-01).
  if (options.forceManaged) {
    const backupRelativePath = `${relativePath}.bak-${context.packageVersion}`;
    operations.push(
      operation(
        options.dryRun ? "would-overwrite-forced" : "overwrite-forced",
        relativePath,
        `backup: ${backupRelativePath}`,
      ),
    );

    if (!options.dryRun) {
      // INV-05: the backup must be fully written before the overwrite happens.
      await fs.writeFile(`${targetPath}.bak-${context.packageVersion}`, actual);
      await fs.writeFile(targetPath, expected);
      context.forcedBackups.push(backupRelativePath);
    }
    return;
  }

  context.modified.push({ relativePath, actual, expected });
  operations.push(
    operation(
      "skip-modified",
      relativePath,
      baselineHash
        ? "local changes differ from baseline and upstream; kept (--force-managed to overwrite, --diff to inspect)"
        : "no baseline hash recorded; local content differs from template and was kept",
    ),
  );
}

async function cleanupInactiveCi(targetDir, options, operations) {
  for (const fileName of inactiveCiWorkflowFiles(options.ci)) {
    await cleanupManagedFile(
      targetDir,
      fileName,
      ciWorkflowRelativePath(fileName),
      options,
      operations,
    );
  }
}

async function cleanupManagedFile(targetDir, fileName, relativePath, options, operations) {
  const targetPath = path.join(targetDir, relativePath);

  if (!(await pathExists(targetPath))) {
    return;
  }

  const actual = await fs.readFile(targetPath, "utf8");
  if (!(await isManagedCiWorkflowContent(fileName, actual))) {
    operations.push(operation("keep", relativePath, "custom workflow"));
    return;
  }

  operations.push(operation(options.dryRun ? "would-delete" : "delete", relativePath, "inactive managed workflow"));

  if (!options.dryRun) {
    await fs.unlink(targetPath);
  }
}

async function updateClaudeSettings(targetDir, options, operations) {
  const relativePath = ".claude/settings.json";
  const targetPath = path.join(targetDir, relativePath);
  const fragment = renderClaudeHookSettings(
    await readJson(fromTemplates(".claude", "settings.hook-fragment.json")),
    options.packageManager,
  );
  const settings = (await pathExists(targetPath)) ? await readJson(targetPath) : {};
  const nextSettings = { ...settings, hooks: { ...(settings.hooks ?? {}) } };
  let changed = false;

  for (const [name, hooks] of Object.entries(fragment.hooks ?? {})) {
    const current = nextSettings.hooks[name];
    const currentJson = current ? JSON.stringify(current) : "";
    const expected = mergeRenderedClaudeHookEntries(current, hooks);
    const expectedJson = JSON.stringify(expected);

    if (currentJson === expectedJson) {
      operations.push(operation("keep", relativePath, `Claude hook ${name}`));
      continue;
    }

    nextSettings.hooks[name] = expected;
    changed = true;
    operations.push(
      operation(
        current ? (options.dryRun ? "would-update" : "update") : (options.dryRun ? "would-create" : "create"),
        relativePath,
        `Claude hook ${name}`,
      ),
    );
  }

  if (changed && !options.dryRun) {
    await writeJson(targetPath, nextSettings);
  }
}

async function updateInstallState(targetDir, effectiveOptions, options, operations, context) {
  const relativePath = ".ai-check-template.json";
  const targetPath = installStatePath(targetDir);
  const exists = await pathExists(targetPath);

  operations.push(
    operation(
      exists ? (options.dryRun ? "would-update" : "update") : (options.dryRun ? "would-create" : "create"),
      relativePath,
      "install state",
    ),
  );

  await writeInstallState(
    targetDir,
    {
      profile: effectiveOptions.profile,
      packageManager: effectiveOptions.packageManager,
      ci: effectiveOptions.ci,
      claudeHooks: effectiveOptions.claudeHooks,
      reviewTemplates: effectiveOptions.reviewTemplates,
      // Record baselines from the on-disk content after all writes so kept
      // files (e.g. local == upstream) get their hash refreshed too (INV-02).
      // Dry runs do not read or record anything (INV-04).
      managedFiles: options.dryRun ? {} : await collectUpdatedManagedFileHashes(targetDir, effectiveOptions, context),
    },
    { dryRun: options.dryRun },
  );
}

async function collectUpdatedManagedFileHashes(targetDir, effectiveOptions, context) {
  const managedFiles = await collectManagedFileHashes(targetDir, effectiveOptions);

  // skip-modified files keep their previous baseline hash: rebasing them onto
  // the locally modified content would make the next update treat that content
  // as "unmodified" and overwrite it silently (FR-02 / INV-01). Files skipped
  // under the FR-04 fallback (no baseline recorded) must NOT adopt the current
  // content as a baseline either — that would make the next update see
  // local == baseline and overwrite the user's changes without warning. They
  // stay baseline-less so the fallback warning repeats on every update (FR-04).
  for (const entry of context.modified) {
    const previousBaseline = context.baseline[entry.relativePath];

    if (previousBaseline) {
      managedFiles[entry.relativePath] = previousBaseline;
    } else {
      delete managedFiles[entry.relativePath];
    }
  }

  return managedFiles;
}

async function maybeInstallDependencies(targetDir, dependencyInstallPlan, options, operations) {
  if (!dependencyInstallPlan) {
    return;
  }

  operations.push(
    dependencyInstallOperation(dependencyInstallPlan, {
      dryRun: options.dryRun,
      path: "package.json",
    }),
  );

  if (!options.dryRun) {
    runDependencyInstall(dependencyInstallPlan, targetDir);
  }
}

function operation(action, filePath, detail = undefined) {
  return {
    action,
    path: normalizeRelative(filePath),
    ...(detail ? { detail } : {}),
  };
}

function normalizeRelative(filePath) {
  return filePath.split(path.sep).join("/");
}

// Minimal LCS-based unified diff (managed files are small; no external
// dependency is allowed for this, NFR-02).
function unifiedDiff({ relativePath, actual, expected }) {
  const actualLines = actual.split("\n");
  const expectedLines = expected.split("\n");
  const rows = actualLines.length;
  const columns = expectedLines.length;
  const lcs = Array.from({ length: rows + 1 }, () => new Array(columns + 1).fill(0));

  for (let row = rows - 1; row >= 0; row -= 1) {
    for (let column = columns - 1; column >= 0; column -= 1) {
      lcs[row][column] = actualLines[row] === expectedLines[column]
        ? lcs[row + 1][column + 1] + 1
        : Math.max(lcs[row + 1][column], lcs[row][column + 1]);
    }
  }

  const lines = [
    `--- a/${relativePath} (local)`,
    `+++ b/${relativePath} (upstream)`,
    `@@ -1,${rows} +1,${columns} @@`,
  ];
  let row = 0;
  let column = 0;

  while (row < rows || column < columns) {
    if (row < rows && column < columns && actualLines[row] === expectedLines[column]) {
      lines.push(` ${actualLines[row]}`);
      row += 1;
      column += 1;
    } else if (column < columns && (row === rows || lcs[row][column + 1] >= lcs[row + 1][column])) {
      lines.push(`+${expectedLines[column]}`);
      column += 1;
    } else {
      lines.push(`-${actualLines[row]}`);
      row += 1;
    }
  }

  return lines.join("\n");
}

function writeHumanOutput(stream, output) {
  writeLine(stream, `ai-check-template update ${output.status}`);
  writeLine(stream, `target: ${output.target}`);
  writeLine(stream, `install-state: ${output.installation.source}`);
  writeLine(stream, `profile: ${output.effectiveOptions.profile}`);
  writeLine(stream, `package-manager: ${output.effectiveOptions.packageManager}`);
  writeLine(stream, `ci: ${output.effectiveOptions.ci}`);
  writeLine(stream, `claude-hooks: ${output.effectiveOptions.claudeHooks}`);
  writeLine(stream, `review-templates: ${output.effectiveOptions.reviewTemplates}`);
  writeLine(stream, `operations: ${output.operations.length}`);

  for (const currentOperation of output.operations) {
    writeLine(
      stream,
      `- ${currentOperation.action}: ${currentOperation.path}${currentOperation.detail ? ` (${currentOperation.detail})` : ""}${currentOperation.command ? ` [${currentOperation.command}]` : ""}`,
    );
  }

  for (const note of output.notes) {
    writeLine(stream, `note: ${note}`);
  }
}
