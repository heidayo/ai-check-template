import path from "node:path";
import { CUSTOM_GATE_SCRIPT_NAMES } from "./custom-profile.mjs";
import { DEFAULT_PACKAGE_MANAGER, validatePackageManager } from "./package-manager.mjs";
import { parseProfiles } from "./profile.mjs";
import { isValidWorkspaceStatePath } from "./workspace.mjs";
import {
  CliError,
  pathExists,
  readJson,
  repoRoot,
  writeJson,
} from "./utils.mjs";

export const INSTALL_STATE_FILE = ".ai-check-template.json";
export const INSTALL_STATE_SCHEMA_VERSION = 2;

const SUPPORTED_SCHEMA_VERSIONS = new Set([1, INSTALL_STATE_SCHEMA_VERSION]);
const MANAGED_FILE_HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;

// SPEC-0065 SEC-03: the recorded custom profile name is embedded into doc paths
// and scripts, so the state validator enforces the same pattern as the
// definition-file validator (custom-profile.mjs) — a tampered state cannot
// smuggle metacharacters back in.
const CUSTOM_PROFILE_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

// SPEC-0065 FR-07 (F1): the `--profile custom:<name>` form is not a built-in
// profile; resolveEffectiveOptions must not route it through parseProfiles. In
// custom mode it records the same inert built-in placeholder init uses
// (writeInitInstallState), leaving the real profile to the caller's custom
// resolution path (resolveDoctorCustomProfile / resolveUpdateCustomProfile).
const CUSTOM_PROFILE_PLACEHOLDER = "react-nextjs";

const PACKAGE_NAME = "ai-check-template";
const VALID_CI_MODES = new Set(["direct", "reusable", "none"]);

export function installStatePath(targetDir) {
  return path.join(targetDir, INSTALL_STATE_FILE);
}

export async function buildInstallState({
  profile,
  ci,
  claudeHooks,
  reviewTemplates,
  packageManager = DEFAULT_PACKAGE_MANAGER,
  managedFiles = {},
  workspace = null,
  customProfile = null,
}) {
  const packageJson = await readJson(path.join(repoRoot, "package.json"));
  const parsedProfile = normalizeProfile(profile);
  const normalizedPackageManager = validatePackageManager(packageManager);

  // SPEC-0061 FR-05 / INV-05: the workspace field is either present and valid
  // or absent entirely — null/empty values are never written.
  if (workspace !== null && !isValidWorkspaceStatePath(workspace)) {
    throw new CliError(`Install state workspace must be a relative path without ".." segments: ${String(workspace)}`);
  }

  // SPEC-0065 FR-06 / INV-05: customProfile is additive — present and valid, or
  // absent. Never write null/empty. Built-in mode passes customProfile: null.
  const normalizedCustomProfile = customProfile !== null
    ? normalizeCustomProfileForState(customProfile)
    : null;

  return {
    schemaVersion: INSTALL_STATE_SCHEMA_VERSION,
    packageName: packageJson.name ?? PACKAGE_NAME,
    packageVersion: packageJson.version ?? "0.0.0",
    profile: serializeProfile(parsedProfile),
    packageManager: normalizedPackageManager,
    ...(workspace !== null ? { workspace } : {}),
    ci,
    claudeHooks: Boolean(claudeHooks),
    reviewTemplates: Boolean(reviewTemplates),
    managedFiles: validateManagedFiles(managedFiles),
    ...(normalizedCustomProfile !== null ? { customProfile: normalizedCustomProfile } : {}),
    managedBy: PACKAGE_NAME,
  };
}

export async function writeInstallState(targetDir, input, { dryRun = false } = {}) {
  const state = await buildInstallState(input);
  await writeJson(installStatePath(targetDir), state, { dryRun });
  return state;
}

export async function loadInstallState(targetDir) {
  const targetPath = installStatePath(targetDir);

  if (!(await pathExists(targetPath))) {
    return { source: "defaults", state: null, error: null };
  }

  let state;
  try {
    state = await readJson(targetPath);
  } catch (error) {
    return invalidState("invalid-install-state", error.message);
  }

  return validateInstallState(state);
}

export function resolveEffectiveOptions(options, installState) {
  const state = installState?.source === "state" ? installState.state : null;
  const stateProfile = state ? serializeProfile(state.profile) : null;

  // SPEC-0065 FR-07 / PRE-02: explicit --profile-file > state customProfile > null.
  // When --profile-file is passed the caller (init/update/doctor) loads the
  // definition file fresh; here we only surface which path/snapshot applies so
  // built-in mode stays untouched (customProfile is null unless custom).
  const explicitProfileFile = options.explicit?.profileFile ? options.profileFile : null;
  const customProfile = explicitProfileFile !== null
    ? null
    : state?.customProfile ?? null;

  // SPEC-0065 FR-07 (F1): in custom mode the required profile field carries an
  // inert built-in placeholder — the same react-nextjs stand-in init records
  // (writeInitInstallState). A `--profile custom:<name>` value is NOT a
  // parseProfiles-valid built-in, so feeding it to normalizeProfile below would
  // throw before the caller's custom resolution (resolveDoctorCustomProfile /
  // resolveUpdateCustomProfile) runs. Custom mode requires an actual definition
  // source: an explicit --profile-file or a state-recorded customProfile. A bare
  // custom:<name> with no definition file stays an error (parseProfiles rejects
  // it), matching pre-F1 behavior.
  const customMode = explicitProfileFile !== null || customProfile !== null;
  const profileInput = customMode
    ? CUSTOM_PROFILE_PLACEHOLDER
    : options.explicit.profile
      ? options.profile
      : stateProfile ?? parseProfiles(options.profile);
  const profile = normalizeProfile(profileInput);

  return {
    profile,
    packageManager: options.explicit.packageManager
      ? options.packageManager
      : state?.packageManager ?? options.packageManager ?? DEFAULT_PACKAGE_MANAGER,
    ci: options.explicit.ci ? options.ci : state?.ci ?? options.ci,
    claudeHooks: options.explicit.claudeHooks
      ? options.claudeHooks
      : state?.claudeHooks ?? options.claudeHooks,
    reviewTemplates: options.explicit.reviewTemplates
      ? options.reviewTemplates
      : state?.reviewTemplates ?? options.reviewTemplates,
    // SPEC-0061 FR-06 / PRE-02: explicit --workspace > install state > null.
    workspace: options.explicit.workspace
      ? options.workspace
      : state?.workspace ?? null,
    // SPEC-0065 FR-07: the explicit --profile-file path (loaded by the caller)
    // or null. Callers prefer this over the state snapshot when set.
    profileFile: explicitProfileFile,
    customProfile,
  };
}

export function installStateIssue(installState) {
  if (!installState?.error) {
    return null;
  }

  return {
    code: installState.error.code,
    path: INSTALL_STATE_FILE,
    message: installState.error.message,
  };
}

export function installationSummary(installState) {
  const summary = {
    source: installState?.source ?? "defaults",
    path: INSTALL_STATE_FILE,
  };

  if (installState?.state) {
    return {
      ...summary,
      schemaVersion: installState.state.schemaVersion,
      packageVersion: installState.state.packageVersion,
      profile: installState.state.profile,
      packageManager: installState.state.packageManager,
      // Additive key (SPEC-0061): present only when the state records one.
      ...(installState.state.workspace !== undefined ? { workspace: installState.state.workspace } : {}),
      ci: installState.state.ci,
      claudeHooks: installState.state.claudeHooks,
      reviewTemplates: installState.state.reviewTemplates,
    };
  }

  if (installState?.error) {
    return {
      ...summary,
      error: installState.error,
    };
  }

  return summary;
}

export function effectiveOptionsSummary(effectiveOptions, custom = null) {
  return {
    // SPEC-0065: in custom mode show custom:<name>; the profiles field still
    // carries the inert built-in placeholder so downstream shape is unchanged.
    profile: custom ? `custom:${custom.name}` : effectiveOptions.profile.all.join("+"),
    profiles: serializeProfile(effectiveOptions.profile),
    packageManager: effectiveOptions.packageManager,
    // Additive key (SPEC-0061): present only in workspace mode.
    ...(effectiveOptions.workspace ? { workspace: effectiveOptions.workspace } : {}),
    // Additive key (SPEC-0065): present only in custom mode.
    ...(custom ? { profileFile: custom.filePath } : {}),
    ci: effectiveOptions.ci,
    claudeHooks: effectiveOptions.claudeHooks,
    reviewTemplates: effectiveOptions.reviewTemplates,
  };
}

export function assertWritableInstallState(installState) {
  if (installState?.error) {
    throw new CliError(`Invalid install state: ${installState.error.message}`);
  }
}

export function validateCiMode(ci) {
  if (!VALID_CI_MODES.has(ci)) {
    throw new CliError("--ci must be one of: direct, reusable, none");
  }
}

function validateInstallState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return invalidState("invalid-install-state", "Install state must be a JSON object");
  }

  if (typeof state.schemaVersion === "number" && state.schemaVersion > INSTALL_STATE_SCHEMA_VERSION) {
    return invalidState(
      "unsupported-install-state",
      `Unsupported install state schemaVersion: ${String(state.schemaVersion)}. `
        + `This install state was written by a newer ai-check-template. `
        + `Upgrade the CLI (npx -y ai-check-template@latest) instead of editing the state file.`,
    );
  }

  if (!SUPPORTED_SCHEMA_VERSIONS.has(state.schemaVersion)) {
    return invalidState(
      "unsupported-install-state",
      `Unsupported install state schemaVersion: ${String(state.schemaVersion)}`,
    );
  }

  if (state.packageName !== PACKAGE_NAME || state.managedBy !== PACKAGE_NAME) {
    return invalidState("invalid-install-state", "Install state is not managed by ai-check-template");
  }

  if (typeof state.packageVersion !== "string" || state.packageVersion.length === 0) {
    return invalidState("invalid-install-state", "Install state packageVersion must be a string");
  }

  let packageManager;
  try {
    packageManager = state.packageManager === undefined
      ? DEFAULT_PACKAGE_MANAGER
      : validatePackageManager(state.packageManager);
  } catch (error) {
    return invalidState("invalid-install-state", error.message);
  }

  let profile;
  try {
    profile = normalizeProfile(state.profile);
  } catch (error) {
    return invalidState("invalid-install-state", error.message);
  }

  if (!VALID_CI_MODES.has(state.ci)) {
    return invalidState("invalid-install-state", "Install state ci must be direct, reusable, or none");
  }

  if (typeof state.claudeHooks !== "boolean") {
    return invalidState("invalid-install-state", "Install state claudeHooks must be a boolean");
  }

  // SPEC-0061 FR-05: workspace is optional and validated only when present.
  // A missing key means single-package mode; null/empty are never valid (INV-05).
  if (state.workspace !== undefined && !isValidWorkspaceStatePath(state.workspace)) {
    return invalidState(
      "invalid-install-state",
      `Install state workspace must be a relative path without ".." segments: ${String(state.workspace)}`,
    );
  }

  const reviewTemplates = state.reviewTemplates === undefined ? false : state.reviewTemplates;
  if (typeof reviewTemplates !== "boolean") {
    return invalidState("invalid-install-state", "Install state reviewTemplates must be a boolean");
  }

  // SPEC-0065 FR-06: customProfile is optional and validated only when present.
  // A missing key means built-in mode; null/empty are never valid (INV-05). The
  // v1 / v2-without-customProfile states stay valid unchanged (NFR-03).
  let customProfile;
  try {
    customProfile = state.customProfile === undefined
      ? undefined
      : validateCustomProfileStateShape(state.customProfile);
  } catch (error) {
    return invalidState("invalid-install-state", error.message);
  }

  // v1 states carry no managedFiles; migrate to an empty map in memory. The
  // migration is persisted (as schemaVersion 2) on the next state write (FR-05).
  let managedFiles;
  try {
    managedFiles = state.schemaVersion === 1 ? {} : validateManagedFiles(state.managedFiles ?? {});
  } catch (error) {
    return invalidState("invalid-install-state", error.message);
  }

  return {
    source: "state",
    state: {
      schemaVersion: state.schemaVersion,
      packageName: state.packageName,
      packageVersion: state.packageVersion,
      profile: serializeProfile(profile),
      packageManager,
      ...(state.workspace !== undefined ? { workspace: state.workspace } : {}),
      ci: state.ci,
      claudeHooks: state.claudeHooks,
      reviewTemplates,
      managedFiles,
      ...(customProfile !== undefined ? { customProfile } : {}),
      managedBy: state.managedBy,
    },
    error: null,
  };
}

function validateManagedFiles(managedFiles) {
  if (!managedFiles || typeof managedFiles !== "object" || Array.isArray(managedFiles)) {
    throw new CliError("Install state managedFiles must be a JSON object");
  }

  const normalized = {};

  for (const [relativePath, entry] of Object.entries(managedFiles)) {
    if (!entry || typeof entry !== "object" || !MANAGED_FILE_HASH_PATTERN.test(entry.hash ?? "")) {
      throw new CliError(`Install state managedFiles entry is invalid: ${relativePath}`);
    }
    normalized[relativePath] = { hash: entry.hash };
  }

  return normalized;
}

function normalizeProfile(profile) {
  if (typeof profile === "string") {
    return parseProfiles(profile);
  }

  if (profile?.base && Array.isArray(profile.addons) && Array.isArray(profile.all)) {
    const parsed = parseProfiles(profile.all.join("+"));
    if (parsed.base !== profile.base || parsed.addons.join("+") !== profile.addons.join("+")) {
      throw new CliError("Install state profile fields are inconsistent");
    }
    return parsed;
  }

  if (profile?.base && Array.isArray(profile.addons)) {
    return parseProfiles([profile.base, ...profile.addons].join("+"));
  }

  if (profile?.all && Array.isArray(profile.all)) {
    return parseProfiles(profile.all.join("+"));
  }

  throw new CliError("Install state profile is invalid");
}

function serializeProfile(profile) {
  return {
    base: profile.base,
    addons: [...profile.addons],
    all: [...profile.all],
  };
}

// SPEC-0065 FR-06: normalize a resolved custom profile snapshot before writing
// it into the install state. Reuses the same shape check as load-time
// validation so a build error and a load error are symmetric (INV-05).
function normalizeCustomProfileForState(customProfile) {
  return validateCustomProfileStateShape(customProfile);
}

// SPEC-0065 FR-06 / SEC-02 / SEC-03: validate the { name, filePath, definition }
// snapshot structurally (no file read). name pattern (SEC-03), filePath must be
// a relative path without ".." (SEC-02 — a tampered state cannot point outside
// the target), definition must cover the three gates. Throws CliError.
function validateCustomProfileStateShape(customProfile) {
  if (!customProfile || typeof customProfile !== "object" || Array.isArray(customProfile)) {
    throw new CliError("Install state customProfile must be an object");
  }

  const allowedKeys = new Set(["name", "filePath", "definition"]);
  for (const key of Object.keys(customProfile)) {
    if (!allowedKeys.has(key)) {
      throw new CliError(`Install state customProfile has unknown key: ${key}`);
    }
  }

  const { name, filePath, definition } = customProfile;

  if (typeof name !== "string" || !CUSTOM_PROFILE_NAME_PATTERN.test(name)) {
    throw new CliError("Install state customProfile.name must match [a-z][a-z0-9-]*");
  }

  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new CliError("Install state customProfile.filePath must be a non-empty string");
  }
  if (path.isAbsolute(filePath) || filePath.split(/[\\/]/).includes("..")) {
    throw new CliError(
      `Install state customProfile.filePath must be a relative path without ".." segments: ${filePath}`,
    );
  }

  const normalizedDefinition = validateCustomProfileDefinitionShape(definition);

  return { name, filePath, definition: normalizedDefinition };
}

function validateCustomProfileDefinitionShape(definition) {
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    throw new CliError("Install state customProfile.definition must be an object");
  }

  const gateScripts = definition.gateScripts;
  if (!gateScripts || typeof gateScripts !== "object" || Array.isArray(gateScripts)) {
    throw new CliError("Install state customProfile.definition.gateScripts must be an object");
  }
  for (const gate of CUSTOM_GATE_SCRIPT_NAMES) {
    if (typeof gateScripts[gate] !== "string" || gateScripts[gate].length === 0) {
      throw new CliError(`Install state customProfile.definition.gateScripts is missing gate: ${gate}`);
    }
  }

  const supportScripts = definition.supportScripts;
  if (!supportScripts || typeof supportScripts !== "object" || Array.isArray(supportScripts)) {
    throw new CliError("Install state customProfile.definition.supportScripts must be an object");
  }

  const devDependencies = definition.devDependencies ?? [];
  if (!Array.isArray(devDependencies) || devDependencies.some((dep) => typeof dep !== "string")) {
    throw new CliError("Install state customProfile.definition.devDependencies must be an array of strings");
  }

  return {
    gateScripts: { ...gateScripts },
    supportScripts: { ...supportScripts },
    devDependencies: [...devDependencies],
  };
}

function invalidState(code, message) {
  return {
    source: code === "unsupported-install-state" ? "unsupported" : "invalid",
    state: null,
    error: { code, message },
  };
}
