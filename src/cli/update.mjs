import fs from "node:fs/promises";
import path from "node:path";
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
import { DEFAULT_PACKAGE_MANAGER, detectPackageManager, validatePackageManager } from "./package-manager.mjs";
import { getProfileDocFiles } from "./profile-docs.mjs";
import { getProfileScripts, getProfileSupportScripts } from "./profile-scripts.mjs";
import {
  CliError,
  fromTemplates,
  pathExists,
  readJson,
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
  --install-deps       Install missing dev dependencies for generated package scripts.
  --dry-run            Print planned operations without writing files.
  --yes                Confirm non-interactive writes.
  --json               Print machine-readable JSON output.`;

const DIRECT_CI_FILES = ["ai-check.yml", "ai-check-fast.yml"];
const REUSABLE_CI_FILES = ["ai-quality-reusable.yml", "ai-quality-call.yml"];

export async function runUpdate(argv, io = {}) {
  const options = parseUpdateArgs(argv, io.cwd ?? process.cwd());

  if (options.help) {
    writeLine(io.stdout, UPDATE_USAGE);
    return;
  }

  if (!options.yes && !options.dryRun) {
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
    profile: effectiveOptions.profile,
    packageManager: effectiveOptions.packageManager,
    ci: effectiveOptions.ci,
    claudeHooks: effectiveOptions.claudeHooks,
  };
  const dependencyInstallPlan = writeOptions.installDeps
    ? await planDependencyInstall(packageJsonPath, writeOptions.profile, writeOptions.packageManager)
    : null;

  if (dependencyInstallPlan && !writeOptions.dryRun) {
    preflightDependencyInstaller(dependencyInstallPlan, targetDir);
  }

  const operations = [];

  await updatePackageScripts(targetDir, packageJsonPath, writeOptions, operations);
  await updateTemplateFile(targetDir, fromTemplates("scripts", "ai-check.sh"), "scripts/ai-check.sh", writeOptions, operations);
  await updateTemplateFile(targetDir, fromTemplates("scripts", "ai-check-fast.sh"), "scripts/ai-check-fast.sh", writeOptions, operations);
  await createMissingProfileDocs(targetDir, writeOptions, operations);
  await updateCi(targetDir, writeOptions, operations);
  await cleanupInactiveCi(targetDir, writeOptions, operations);

  if (writeOptions.claudeHooks) {
    await updateTemplateFile(
      targetDir,
      fromTemplates(".claude", "rules", "test-rules.md"),
      ".claude/rules/test-rules.md",
      writeOptions,
      operations,
    );
    await updateClaudeSettings(targetDir, writeOptions, operations);
  }

  await updateInstallState(targetDir, effectiveOptions, writeOptions, operations);
  await maybeInstallDependencies(targetDir, dependencyInstallPlan, writeOptions, operations);

  const output = {
    status: options.dryRun ? "dry-run" : "updated",
    target: targetDir,
    installation: installationSummary(installState),
    effectiveOptions: effectiveOptionsSummary(effectiveOptions),
    operations,
  };

  if (options.json) {
    writeLine(io.stdout, JSON.stringify(output, null, 2));
  } else {
    writeHumanOutput(io.stdout, output);
  }
}

function parseUpdateArgs(argv, cwd) {
  const options = {
    target: cwd,
    profile: "react-nextjs",
    packageManager: DEFAULT_PACKAGE_MANAGER,
    ci: "direct",
    claudeHooks: false,
    installDeps: false,
    dryRun: false,
    yes: false,
    json: false,
    help: false,
    explicit: {
      profile: false,
      packageManager: false,
      ci: false,
      claudeHooks: false,
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
  const supportScripts = getProfileSupportScripts(options.profile);
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

async function updateTemplateFile(targetDir, sourcePath, relativePath, options, operations) {
  const targetPath = path.join(targetDir, relativePath);
  const expected = await fs.readFile(sourcePath, "utf8");
  const exists = await pathExists(targetPath);

  if (exists) {
    const actual = await fs.readFile(targetPath, "utf8");
    if (actual === expected) {
      operations.push(operation("keep", relativePath));
      return;
    }
  }

  operations.push(
    operation(
      exists ? (options.dryRun ? "would-update" : "update") : (options.dryRun ? "would-create" : "create"),
      relativePath,
    ),
  );

  if (!options.dryRun) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, expected);
  }
}

async function createMissingProfileDocs(targetDir, options, operations) {
  for (const file of getProfileDocFiles(options.profile)) {
    await createMissingTemplateFile(targetDir, file.sourcePath, file.relativePath, options, operations, "profile doc");
  }
}

async function createMissingTemplateFile(targetDir, sourcePath, relativePath, options, operations, detail) {
  const targetPath = path.join(targetDir, relativePath);

  if (await pathExists(targetPath)) {
    operations.push(operation("keep", relativePath, detail));
    return;
  }

  operations.push(operation(options.dryRun ? "would-create" : "create", relativePath, detail));

  if (!options.dryRun) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }
}

async function updateCi(targetDir, options, operations) {
  const files = options.ci === "direct"
    ? DIRECT_CI_FILES
    : options.ci === "reusable"
      ? REUSABLE_CI_FILES
      : [];

  for (const fileName of files) {
    await updateTemplateFile(
      targetDir,
      fromTemplates("ci-examples", "github-actions", fileName),
      path.join(".github", "workflows", fileName),
      options,
      operations,
    );
  }
}

async function cleanupInactiveCi(targetDir, options, operations) {
  const files = options.ci === "direct"
    ? REUSABLE_CI_FILES
    : options.ci === "reusable"
      ? DIRECT_CI_FILES
      : [...DIRECT_CI_FILES, ...REUSABLE_CI_FILES];

  for (const fileName of files) {
    await cleanupManagedFile(
      targetDir,
      fromTemplates("ci-examples", "github-actions", fileName),
      path.join(".github", "workflows", fileName),
      options,
      operations,
    );
  }
}

async function cleanupManagedFile(targetDir, sourcePath, relativePath, options, operations) {
  const targetPath = path.join(targetDir, relativePath);

  if (!(await pathExists(targetPath))) {
    return;
  }

  const [actual, expected] = await Promise.all([
    fs.readFile(targetPath, "utf8"),
    fs.readFile(sourcePath, "utf8"),
  ]);

  if (actual !== expected) {
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

async function updateInstallState(targetDir, effectiveOptions, options, operations) {
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
    },
    { dryRun: options.dryRun },
  );
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

function writeHumanOutput(stream, output) {
  writeLine(stream, `ai-check-template update ${output.status}`);
  writeLine(stream, `target: ${output.target}`);
  writeLine(stream, `install-state: ${output.installation.source}`);
  writeLine(stream, `profile: ${output.effectiveOptions.profile}`);
  writeLine(stream, `package-manager: ${output.effectiveOptions.packageManager}`);
  writeLine(stream, `ci: ${output.effectiveOptions.ci}`);
  writeLine(stream, `claude-hooks: ${output.effectiveOptions.claudeHooks}`);
  writeLine(stream, `operations: ${output.operations.length}`);

  for (const currentOperation of output.operations) {
    writeLine(
      stream,
      `- ${currentOperation.action}: ${currentOperation.path}${currentOperation.detail ? ` (${currentOperation.detail})` : ""}${currentOperation.command ? ` [${currentOperation.command}]` : ""}`,
    );
  }
}
