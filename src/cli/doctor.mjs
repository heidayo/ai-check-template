import fs from "node:fs/promises";
import path from "node:path";
import {
  ciWorkflowRelativePath,
  inactiveCiWorkflowFiles,
  isManagedCiWorkflowContent,
} from "./ci-workflows.mjs";
import {
  customDocProfile,
  loadCustomProfile,
  parseCustomProfileFlag,
  resolveCustomProfilePath,
  resolveCustomProfileScripts,
} from "./custom-profile.mjs";
import { getManagedFiles, hashContent } from "./managed-files.mjs";
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
import { getProfileScripts, getProfileSupportScripts, splitGateScripts } from "./profile-scripts.mjs";
import { resolveWorkspace } from "./workspace.mjs";
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
                       With --profile-file, pass custom:<name> for a custom profile.
  --profile-file <path> Custom profile definition file (.ai-check-profile.yaml / .json),
                       relative to --target. Defaults to the install state's custom profile.
  --package-manager <name> Package manager: pnpm, npm, yarn, or bun. Defaults to install state or target detection.
  --ci <mode>          CI mode to check: direct, reusable, or none. Defaults to direct.
  --claude-hooks       Check Claude rule and hook settings.
  --review-templates   Check PR template and AI code understanding worksheet.
  --workspace <pkg-dir> Target workspace package (relative path, single). Defaults to the
                       install state.
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
  const baseline = installState.state?.managedFiles ?? {};

  // SPEC-0065 FR-07 / AC-07: doctor diagnoses a custom profile (from --profile-file
  // or state customProfile). Path violations (SEC-02) fail fast; a missing /
  // schema-invalid definition or a drift is an issue (exit 1), not a throw. The
  // custom profile intent also switches script diagnosis off the built-in path.
  const custom = await resolveDoctorCustomProfile(targetDir, options, effectiveOptions);

  // SPEC-0061 FR-06: doctor runs the FR-02 workspace validation as a diagnosis
  // (issue + exit 1) instead of failing fast, e.g. when the package was deleted
  // after init (境界ケース1). Script checks are skipped while unresolved.
  let workspaceInfo = null;
  let workspaceIssue = null;
  if (effectiveOptions.workspace) {
    try {
      workspaceInfo = await resolveWorkspace(targetDir, effectiveOptions.workspace);
    } catch (error) {
      workspaceIssue = issue("invalid-workspace", effectiveOptions.workspace, error.message);
    }
  }

  const result = await diagnoseTarget(targetDir, { ...effectiveOptions, workspaceInfo, custom }, baseline);
  const stateIssue = installStateIssue(installState);
  const issues = [
    ...(stateIssue ? [stateIssue] : []),
    ...(workspaceIssue ? [workspaceIssue] : []),
    ...result.issues,
  ];
  const failed = issues.length > 0 || (options.strict && result.warnings.length > 0);
  const output = {
    status: failed ? "fail" : "pass",
    target: targetDir,
    strict: options.strict,
    schemaVersion: installState.state?.schemaVersion ?? null,
    installation: installationSummary(installState),
    effectiveOptions: effectiveOptionsSummary(effectiveOptions, custom?.bundle ?? null),
    managedFiles: result.managedFiles,
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
    workspace: null,
    profileFile: null,
    explicit: {
      profile: false,
      packageManager: false,
      ci: false,
      claudeHooks: false,
      reviewTemplates: false,
      workspace: false,
      profileFile: false,
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

    if (arg.startsWith("--profile-file=")) {
      setProfileFileOption(options, arg.slice("--profile-file=".length));
      continue;
    }

    if (arg === "--profile-file") {
      setProfileFileOption(options, readFlagValue(argv, (index += 1), arg));
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

    if (arg.startsWith("--workspace=")) {
      setWorkspaceOption(options, arg.slice("--workspace=".length));
      continue;
    }

    if (arg === "--workspace") {
      setWorkspaceOption(options, readFlagValue(argv, (index += 1), arg));
      continue;
    }

    throw new CliError(`Unknown doctor option: ${arg}\n\n${DOCTOR_USAGE}`);
  }

  validateCiMode(options.ci);

  // SPEC-0065 (v1 scope): custom profiles use single-package placement.
  if (options.profileFile && options.workspace) {
    throw new CliError("--profile-file (custom profile) cannot be combined with --workspace in this version.");
  }

  return options;
}

// SPEC-0061 FR-01: --workspace accepts a single value only.
function setWorkspaceOption(options, value) {
  if (options.workspace !== null) {
    throw new CliError("--workspace can only be specified once (single workspace support)");
  }
  options.workspace = value;
  options.explicit.workspace = true;
}

// SPEC-0065 FR-01: --profile-file accepts a single value only.
function setProfileFileOption(options, value) {
  if (options.profileFile !== null) {
    throw new CliError("--profile-file can only be specified once (single custom profile support)");
  }
  options.profileFile = value;
  options.explicit.profileFile = true;
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

// SPEC-0065 FR-07 / AC-07: resolve the custom profile intent for doctor.
// Precedence: explicit --profile-file (with --profile custom:<name>) > state
// customProfile > null. SEC-02 path violations fail fast (CliError). A definition
// file that is missing (a) or schema-invalid is reported as an issue, and its
// content is compared to the state snapshot for drift (b). Returns null in
// built-in mode so doctor stays on the built-in path (INV-01).
async function resolveDoctorCustomProfile(targetDir, options, effectiveOptions) {
  let name;
  let filePath;
  let stateSnapshot;

  if (effectiveOptions.profileFile !== null) {
    name = parseCustomProfileFlag(options.profile);
    filePath = effectiveOptions.profileFile;
    stateSnapshot = effectiveOptions.customProfile ?? null;
  } else if (effectiveOptions.customProfile) {
    name = effectiveOptions.customProfile.name;
    filePath = effectiveOptions.customProfile.filePath;
    stateSnapshot = effectiveOptions.customProfile;
  } else {
    return null;
  }

  // SEC-02: a bad path (absolute / traversal / outside target) fails fast even
  // in doctor — it signals a misconfigured flag, not a diagnosable drift.
  resolveCustomProfilePath(targetDir, filePath);

  const custom = { name, filePath, stateSnapshot, bundle: null, issues: [] };

  let loaded;
  try {
    loaded = await loadCustomProfile(targetDir, filePath);
  } catch (error) {
    custom.issues.push(issue("missing-profile-file", filePath, error.message));
    return custom;
  }

  if (loaded.name !== name) {
    custom.issues.push(issue(
      "profile-file-drift",
      filePath,
      `Definition file profile.name "${loaded.name}" does not match the recorded custom profile "${name}"`,
    ));
    return custom;
  }

  const { gateScripts, supportScripts } = resolveCustomProfileScripts(loaded.definition, {
    packageManager: effectiveOptions.packageManager,
  });
  custom.bundle = { name: loaded.name, filePath: loaded.filePath, definition: loaded.definition, gateScripts, supportScripts };

  // (b) drift between the definition file's resolved snapshot and the state.
  if (stateSnapshot) {
    const expected = { gateScripts, supportScripts, devDependencies: resolveDevDependencies(loaded.definition) };
    if (JSON.stringify(expected) !== JSON.stringify(stateSnapshot.definition)) {
      custom.issues.push(issue(
        "profile-file-drift",
        filePath,
        "Custom profile definition file differs from the snapshot recorded in the install state; run update",
      ));
    }
  }

  return custom;
}

function resolveDevDependencies(definition) {
  return [...definition.devDependencies];
}

async function diagnoseTarget(targetDir, options, baseline) {
  const issues = [];
  let warnings = [];
  const managedFiles = [];
  const packageJsonPath = path.join(targetDir, "package.json");

  if (!(await pathExists(packageJsonPath))) {
    return {
      warnings,
      managedFiles,
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
    return { issues, warnings, managedFiles };
  }

  // SPEC-0061 FR-06: in workspace mode the gate scripts are checked against
  // the root package.json and the step scripts against the target package.
  // While the configured workspace fails FR-02 validation (already reported as
  // an issue by the caller), script diagnosis is skipped entirely.
  // SPEC-0065 FR-07 / AC-07: in custom mode the built-in script diagnosis
  // (checkPackageScripts / diagnoseProfileScripts) is never called; custom uses
  // its own drift check below (INV-03 — no built-in path for custom).
  let profileWarnings = [];
  if (options.custom) {
    issues.push(...options.custom.issues);
    checkCustomProfileScripts(packageJson, options.custom, issues);
  } else if (options.workspaceInfo) {
    profileWarnings = await checkWorkspaceScripts(targetDir, packageJson, options, issues);
  } else if (!options.workspace) {
    checkPackageScripts(packageJson, options.profile, issues, options.packageManager);
    profileWarnings = diagnoseProfileScripts(options.profile, packageJson);
  }

  // SPEC-0065 FR-05 / ASM-02: custom docs use the custom doc profile so
  // custom-<name>/README.md is diagnosed rather than the built-in placeholder.
  const managedFileOptions = options.custom
    ? { ...options, profile: customDocProfile(options.custom.name) }
    : options;

  for (const file of getManagedFiles(managedFileOptions)) {
    // Skip custom profile docs that are not bundled in package-templates
    // (境界ケース1) — the CLI never generates them.
    if (file.kind === "profile-doc" && file.sourcePath && !(await pathExists(file.sourcePath))) {
      continue;
    }

    const baselineHash = baseline[normalizeRelative(file.relativePath)]?.hash ?? null;

    // Profile docs are only drift-checked when a baseline hash exists; manual
    // (state-less) installs are not required to carry them.
    if (file.kind === "profile-doc" && !baselineHash) {
      continue;
    }

    await checkManagedFile(targetDir, file, baselineHash, issues, warnings, managedFiles);
  }

  const ciWarnings = await diagnoseInactiveCi(targetDir, options.ci);

  if (options.claudeHooks) {
    await checkClaudeSettings(targetDir, issues);
  }

  warnings = [...profileWarnings, ...warnings, ...ciWarnings];

  return { issues, warnings, managedFiles };
}

// Per-file status distinction (SPEC-0056 FR-06):
// - ok             local matches the rendered template
// - drift-upstream local matches the recorded baseline but the template moved on (update pending)
// - modified-local local differs from the recorded baseline (user customization)
// - drift          local differs and no baseline hash is recorded (byte-comparison fallback)
// - missing        the managed file does not exist
async function checkManagedFile(targetDir, file, baselineHash, issues, warnings, managedFiles) {
  const relativePath = normalizeRelative(file.relativePath);
  const targetPath = path.join(targetDir, file.relativePath);

  if (!(await pathExists(targetPath))) {
    managedFiles.push({ path: relativePath, status: "missing" });

    if (baselineHash) {
      warnings.push(warning("missing-managed-file", relativePath, "Tracked managed file is missing; update will regenerate it"));
    } else {
      issues.push(issue("missing-file", relativePath, "Expected template file is missing"));
    }
    return;
  }

  const actual = await fs.readFile(targetPath, "utf8");
  const expected = await file.render();

  if (actual === expected) {
    managedFiles.push({ path: relativePath, status: "ok" });
    return;
  }

  if (!baselineHash) {
    managedFiles.push({ path: relativePath, status: "drift" });
    issues.push(issue("drift", relativePath, "Template-managed file differs (no baseline hash recorded)"));
    return;
  }

  if (hashContent(actual) === baselineHash) {
    managedFiles.push({ path: relativePath, status: "drift-upstream" });
    issues.push(issue("drift-upstream", relativePath, "Managed file is unmodified but behind the template; run update"));
    return;
  }

  managedFiles.push({ path: relativePath, status: "modified-local" });
  warnings.push(
    warning(
      "modified-local",
      relativePath,
      "Managed file has local modifications; update keeps it (use update --diff / --force-managed to resolve)",
    ),
  );
}

function checkPackageScripts(packageJson, profile, issues, packageManager) {
  const expectedScripts = getProfileScripts(profile, { packageManager });
  compareExpectedScripts(packageJson.scripts ?? {}, expectedScripts, "package.json", issues);
}

// SPEC-0065 FR-07 / AC-07 (c): compare the target package.json gate + support
// scripts against the resolved custom definition. When the definition file is
// missing / invalid the bundle is null and the missing-file issue already fired,
// so scripts are not double-reported here (INV-03 — no built-in table used).
function checkCustomProfileScripts(packageJson, custom, issues) {
  if (!custom.bundle) {
    return;
  }
  const expectedScripts = { ...custom.bundle.gateScripts, ...custom.bundle.supportScripts };
  compareExpectedScripts(packageJson.scripts ?? {}, expectedScripts, "package.json", issues);
}

// SPEC-0061 FR-06: expected scripts are compared by exact match in both
// locations, reusing the existing missing-script / drift issue codes with the
// path indicating which package.json is affected.
async function checkWorkspaceScripts(targetDir, rootPackageJson, options, issues) {
  const expectedScripts = getProfileScripts(options.profile, {
    packageManager: options.packageManager,
    workspace: options.workspaceInfo,
  });
  const { gate, step } = splitGateScripts(expectedScripts);
  const packageRelativePath = `${options.workspaceInfo.dir}/package.json`;
  const packagePackageJsonPath = path.join(targetDir, ...options.workspaceInfo.dir.split("/"), "package.json");

  compareExpectedScripts(rootPackageJson.scripts ?? {}, gate, "package.json", issues);

  let packagePackageJson;
  try {
    packagePackageJson = await readJson(packagePackageJsonPath);
  } catch (error) {
    issues.push(issue("invalid-json", packageRelativePath, error.message));
    return [];
  }

  compareExpectedScripts(packagePackageJson.scripts ?? {}, step, packageRelativePath, issues);

  // Support scripts (typecheck / lint / ...) are user-owned commands: only
  // their presence is required, since the root gate scripts invoke them in the
  // package (FR-04). This replaces the disabled script-reference scan (FR-06).
  const supportScripts = getProfileSupportScripts(options.profile, { packageManager: options.packageManager });
  for (const name of Object.keys(supportScripts)) {
    if (!packagePackageJson.scripts?.[name]) {
      issues.push(issue("missing-script", packageRelativePath, `Missing package script: ${name}`));
    }
  }

  // Advice heuristics inspect the package that owns the step scripts; the
  // script-reference regex scan is disabled in workspace mode (FR-06).
  return diagnoseProfileScripts(options.profile, packagePackageJson, { workspace: true })
    .map((entry) => ({ ...entry, path: packageRelativePath }));
}

function compareExpectedScripts(scripts, expectedScripts, relativePath, issues) {
  for (const [name, expected] of Object.entries(expectedScripts)) {
    if (!scripts[name]) {
      issues.push(issue("missing-script", relativePath, `Missing package script: ${name}`));
      continue;
    }

    if (scripts[name] !== expected) {
      issues.push(issue("drift", relativePath, `Package script differs: ${name}`));
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
  writeLine(stream, `schema-version: ${output.schemaVersion ?? "none"}`);
  writeLine(stream, `profile: ${output.effectiveOptions.profile}`);
  writeLine(stream, `package-manager: ${output.effectiveOptions.packageManager}`);
  if (output.effectiveOptions.workspace) {
    writeLine(stream, `workspace: ${output.effectiveOptions.workspace}`);
  }
  writeLine(stream, `ci: ${output.effectiveOptions.ci}`);
  writeLine(stream, `claude-hooks: ${output.effectiveOptions.claudeHooks}`);
  writeLine(stream, `review-templates: ${output.effectiveOptions.reviewTemplates}`);
  writeLine(stream, `strict: ${output.strict}`);

  writeLine(stream, `managed-files: ${output.managedFiles.length}`);
  for (const managedFile of output.managedFiles) {
    writeLine(stream, `- ${managedFile.status}: ${managedFile.path}`);
  }

  writeLine(stream, `issues: ${output.issues.length}`);
  for (const currentIssue of output.issues) {
    writeLine(stream, `- ${currentIssue.code}: ${currentIssue.path} (${currentIssue.message})`);
  }

  writeLine(stream, `warnings: ${output.warnings.length}`);
  for (const currentWarning of output.warnings) {
    writeLine(stream, `- ${currentWarning.code}: ${currentWarning.path} (${currentWarning.message})`);
  }
}
