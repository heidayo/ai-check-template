import fs from "node:fs/promises";
import path from "node:path";
import {
  ciWorkflowRelativePath,
  inactiveCiWorkflowFiles,
  isManagedCiWorkflowContent,
} from "./ci-workflows.mjs";
import { getManagedFiles } from "./managed-files.mjs";
import {
  effectiveOptionsSummary,
  installationSummary,
  installStateIssue,
  loadInstallState,
  resolveEffectiveOptions,
  validateCiMode,
} from "./install-state.mjs";
import { DEFAULT_PACKAGE_MANAGER, detectPackageManager, validatePackageManager } from "./package-manager.mjs";
import { diagnoseProfileScripts } from "./profile-diagnostics.mjs";
import { getProfileScripts } from "./profile-scripts.mjs";
import {
  CliError,
  pathExists,
  readJson,
  resolveTarget,
  writeLine,
} from "./utils.mjs";

const DOCTOR_USAGE = `ai-check-template doctor

Usage:
  ai-check-template doctor --target <dir> [options]

Options:
  --target <dir>       Target project directory. Defaults to the current directory.
  --profile <name>     Profile to check. Defaults to install state or react-nextjs.
  --package-manager <name> Package manager: pnpm, npm, yarn, or bun. Defaults to install state or target detection.
  --ci <mode>          CI mode to check: direct, reusable, or none. Defaults to direct.
  --claude-hooks       Check Claude rule and hook settings.
  --review-templates   Check PR template and AI code understanding worksheet.
  --strict             Treat warnings as failures.
  --json               Print machine-readable JSON output.`;

export async function runDoctor(argv, io = {}) {
  const options = parseDoctorArgs(argv, io.cwd ?? process.cwd());

  if (options.help) {
    writeLine(io.stdout, DOCTOR_USAGE);
    return;
  }

  const targetDir = await normalizeTargetDir(options.target);
  options.packageManager = options.explicit.packageManager
    ? options.packageManager
    : await detectPackageManager(targetDir);
  const installState = await loadInstallState(targetDir);
  const effectiveOptions = resolveEffectiveOptions(options, installState);
  const result = await diagnoseTarget(targetDir, effectiveOptions);
  const stateIssue = installStateIssue(installState);
  const issues = stateIssue ? [stateIssue, ...result.issues] : result.issues;
  const failed = issues.length > 0 || (options.strict && result.warnings.length > 0);
  const output = {
    status: failed ? "fail" : "pass",
    target: targetDir,
    strict: options.strict,
    installation: installationSummary(installState),
    effectiveOptions: effectiveOptionsSummary(effectiveOptions),
    warnings: result.warnings,
    issues,
  };

  if (options.json) {
    writeLine(io.stdout, JSON.stringify(output, null, 2));
  } else {
    writeHumanOutput(io.stdout, output);
  }

  if (output.status === "fail") {
    throw new CliError(
      `doctor found ${output.issues.length} issue(s) and ${output.warnings.length} warning(s)`,
      1,
    );
  }
}

function parseDoctorArgs(argv, cwd) {
  const options = {
    target: cwd,
    profile: "react-nextjs",
    packageManager: DEFAULT_PACKAGE_MANAGER,
    ci: "direct",
    claudeHooks: false,
    reviewTemplates: false,
    strict: false,
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

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--strict") {
      options.strict = true;
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

    throw new CliError(`Unknown doctor option: ${arg}\n\n${DOCTOR_USAGE}`);
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

async function diagnoseTarget(targetDir, options) {
  const issues = [];
  let warnings = [];
  const packageJsonPath = path.join(targetDir, "package.json");

  if (!(await pathExists(packageJsonPath))) {
    return {
      warnings,
      issues: [
        issue("missing-file", "package.json", "Target project must contain package.json"),
      ],
    };
  }

  let packageJson;
  try {
    packageJson = await readJson(packageJsonPath);
  } catch (error) {
    issues.push(issue("invalid-json", "package.json", error.message));
    return { issues, warnings };
  }

  checkPackageScripts(packageJson, options.profile, issues, options.packageManager);

  for (const file of getManagedFiles(options)) {
    if (file.kind === "profile-doc") {
      continue;
    }

    await checkExpectedFileContent(targetDir, await file.render(), file.relativePath, issues);
  }

  const ciWarnings = await diagnoseInactiveCi(targetDir, options.ci);

  if (options.claudeHooks) {
    await checkClaudeSettings(targetDir, issues);
  }

  warnings = [...diagnoseProfileScripts(options.profile, packageJson), ...ciWarnings];

  return { issues, warnings };
}

function checkPackageScripts(packageJson, profile, issues, packageManager) {
  const expectedScripts = getProfileScripts(profile, { packageManager });
  const scripts = packageJson.scripts ?? {};

  for (const [name, expected] of Object.entries(expectedScripts)) {
    if (!scripts[name]) {
      issues.push(issue("missing-script", "package.json", `Missing package script: ${name}`));
      continue;
    }

    if (scripts[name] !== expected) {
      issues.push(issue("drift", "package.json", `Package script differs: ${name}`));
    }
  }
}

async function diagnoseInactiveCi(targetDir, ciMode) {
  const warnings = [];

  for (const fileName of inactiveCiWorkflowFiles(ciMode)) {
    const relativePath = ciWorkflowRelativePath(fileName);
    const matchesManagedTemplate = await matchesManagedCiWorkflow(targetDir, fileName, relativePath);

    if (matchesManagedTemplate) {
      warnings.push(
        warning(
          "ci-advice",
          relativePath,
          `Managed CI workflow is inactive for ci mode: ${ciMode}`,
        ),
      );
    }
  }

  return warnings;
}

async function checkExpectedFileContent(targetDir, expected, relativePath, issues) {
  const targetPath = path.join(targetDir, relativePath);

  if (!(await pathExists(targetPath))) {
    issues.push(issue("missing-file", normalizeRelative(relativePath), "Expected template file is missing"));
    return;
  }

  const actual = await fs.readFile(targetPath, "utf8");

  if (actual !== expected) {
    issues.push(issue("drift", normalizeRelative(relativePath), "Template-managed file differs"));
  }
}

async function matchesManagedCiWorkflow(targetDir, fileName, relativePath) {
  const targetPath = path.join(targetDir, relativePath);

  if (!(await pathExists(targetPath))) {
    return false;
  }

  return isManagedCiWorkflowContent(fileName, await fs.readFile(targetPath, "utf8"));
}

async function checkClaudeSettings(targetDir, issues) {
  const relativePath = ".claude/settings.json";
  const targetPath = path.join(targetDir, relativePath);

  if (!(await pathExists(targetPath))) {
    issues.push(issue("missing-file", relativePath, "Claude settings file is missing"));
    return;
  }

  let settings;
  try {
    settings = await readJson(targetPath);
  } catch (error) {
    issues.push(issue("invalid-json", relativePath, error.message));
    return;
  }

  const requiredHooks = ["PostToolUse", "Stop"];
  for (const hookName of requiredHooks) {
    if (!settings.hooks?.[hookName]) {
      issues.push(issue("missing-hook", relativePath, `Missing Claude hook: ${hookName}`));
    }
  }
}

function issue(code, filePath, message) {
  return { code, path: normalizeRelative(filePath), message };
}

function warning(code, filePath, message) {
  return { code, path: normalizeRelative(filePath), message };
}

function normalizeRelative(filePath) {
  return filePath.split(path.sep).join("/");
}

function writeHumanOutput(stream, output) {
  writeLine(stream, `ai-check-template doctor ${output.status}`);
  writeLine(stream, `target: ${output.target}`);
  writeLine(stream, `install-state: ${output.installation.source}`);
  writeLine(stream, `profile: ${output.effectiveOptions.profile}`);
  writeLine(stream, `package-manager: ${output.effectiveOptions.packageManager}`);
  writeLine(stream, `ci: ${output.effectiveOptions.ci}`);
  writeLine(stream, `claude-hooks: ${output.effectiveOptions.claudeHooks}`);
  writeLine(stream, `review-templates: ${output.effectiveOptions.reviewTemplates}`);
  writeLine(stream, `strict: ${output.strict}`);

  writeLine(stream, `issues: ${output.issues.length}`);
  for (const currentIssue of output.issues) {
    writeLine(stream, `- ${currentIssue.code}: ${currentIssue.path} (${currentIssue.message})`);
  }

  writeLine(stream, `warnings: ${output.warnings.length}`);
  for (const currentWarning of output.warnings) {
    writeLine(stream, `- ${currentWarning.code}: ${currentWarning.path} (${currentWarning.message})`);
  }
}
