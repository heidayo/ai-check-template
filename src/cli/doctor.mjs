import fs from "node:fs/promises";
import path from "node:path";
import {
  effectiveOptionsSummary,
  installationSummary,
  installStateIssue,
  loadInstallState,
  resolveEffectiveOptions,
  validateCiMode,
} from "./install-state.mjs";
import {
  CliError,
  fromTemplates,
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
  --ci <mode>          CI mode to check: direct, reusable, or none. Defaults to direct.
  --claude-hooks       Check Claude rule and hook settings.
  --json               Print machine-readable JSON output.`;

const DIRECT_CI_FILES = ["ai-check.yml", "ai-check-fast.yml"];
const REUSABLE_CI_FILES = ["ai-quality-reusable.yml", "ai-quality-call.yml"];

export async function runDoctor(argv, io = {}) {
  const options = parseDoctorArgs(argv, io.cwd ?? process.cwd());

  if (options.help) {
    writeLine(io.stdout, DOCTOR_USAGE);
    return;
  }

  const targetDir = await normalizeTargetDir(options.target);
  const installState = await loadInstallState(targetDir);
  const effectiveOptions = resolveEffectiveOptions(options, installState);
  const result = await diagnoseTarget(targetDir, effectiveOptions);
  const stateIssue = installStateIssue(installState);
  const issues = stateIssue ? [stateIssue, ...result.issues] : result.issues;
  const output = {
    status: issues.length === 0 ? "pass" : "fail",
    target: targetDir,
    installation: installationSummary(installState),
    effectiveOptions: effectiveOptionsSummary(effectiveOptions),
    issues,
  };

  if (options.json) {
    writeLine(io.stdout, JSON.stringify(output, null, 2));
  } else {
    writeHumanOutput(io.stdout, output);
  }

  if (output.status === "fail") {
    throw new CliError(`doctor found ${output.issues.length} issue(s)`, 1);
  }
}

function parseDoctorArgs(argv, cwd) {
  const options = {
    target: cwd,
    profile: "react-nextjs",
    ci: "direct",
    claudeHooks: false,
    json: false,
    help: false,
    explicit: {
      profile: false,
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
  const packageJsonPath = path.join(targetDir, "package.json");

  if (!(await pathExists(packageJsonPath))) {
    return {
      issues: [
        issue("missing-file", "package.json", "Target project must contain package.json"),
      ],
    };
  }

  await checkPackageScripts(targetDir, packageJsonPath, issues);
  await checkTemplateFile(targetDir, fromTemplates("scripts", "ai-check.sh"), "scripts/ai-check.sh", issues);
  await checkTemplateFile(targetDir, fromTemplates("scripts", "ai-check-fast.sh"), "scripts/ai-check-fast.sh", issues);
  await checkCi(targetDir, options.ci, issues);

  if (options.claudeHooks) {
    await checkTemplateFile(
      targetDir,
      fromTemplates(".claude", "rules", "test-rules.md"),
      ".claude/rules/test-rules.md",
      issues,
    );
    await checkClaudeSettings(targetDir, issues);
  }

  return { issues };
}

async function checkPackageScripts(targetDir, packageJsonPath, issues) {
  let packageJson;
  try {
    packageJson = await readJson(packageJsonPath);
  } catch (error) {
    issues.push(issue("invalid-json", "package.json", error.message));
    return;
  }

  const fragment = await readJson(fromTemplates("package.scripts.fragment.json"));
  const scripts = packageJson.scripts ?? {};

  for (const [name, expected] of Object.entries(fragment.scripts ?? {})) {
    if (!scripts[name]) {
      issues.push(issue("missing-script", "package.json", `Missing package script: ${name}`));
      continue;
    }

    if (scripts[name] !== expected) {
      issues.push(issue("drift", "package.json", `Package script differs: ${name}`));
    }
  }
}

async function checkCi(targetDir, ciMode, issues) {
  const files = ciMode === "direct"
    ? DIRECT_CI_FILES
    : ciMode === "reusable"
      ? REUSABLE_CI_FILES
      : [];

  for (const fileName of files) {
    await checkTemplateFile(
      targetDir,
      fromTemplates("ci-examples", "github-actions", fileName),
      path.join(".github", "workflows", fileName),
      issues,
    );
  }
}

async function checkTemplateFile(targetDir, expectedPath, relativePath, issues) {
  const targetPath = path.join(targetDir, relativePath);

  if (!(await pathExists(targetPath))) {
    issues.push(issue("missing-file", normalizeRelative(relativePath), "Expected template file is missing"));
    return;
  }

  const [actual, expected] = await Promise.all([
    fs.readFile(targetPath, "utf8"),
    fs.readFile(expectedPath, "utf8"),
  ]);

  if (actual !== expected) {
    issues.push(issue("drift", normalizeRelative(relativePath), "Template-managed file differs"));
  }
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

function normalizeRelative(filePath) {
  return filePath.split(path.sep).join("/");
}

function writeHumanOutput(stream, output) {
  writeLine(stream, `ai-check-template doctor ${output.status}`);
  writeLine(stream, `target: ${output.target}`);
  writeLine(stream, `install-state: ${output.installation.source}`);
  writeLine(stream, `profile: ${output.effectiveOptions.profile}`);
  writeLine(stream, `ci: ${output.effectiveOptions.ci}`);
  writeLine(stream, `claude-hooks: ${output.effectiveOptions.claudeHooks}`);

  if (output.issues.length === 0) {
    writeLine(stream, "issues: 0");
    return;
  }

  writeLine(stream, `issues: ${output.issues.length}`);
  for (const currentIssue of output.issues) {
    writeLine(stream, `- ${currentIssue.code}: ${currentIssue.path} (${currentIssue.message})`);
  }
}
