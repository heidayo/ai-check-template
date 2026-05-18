import path from "node:path";
import { DEFAULT_PACKAGE_MANAGER, validatePackageManager } from "./package-manager.mjs";
import { parseProfiles } from "./profile.mjs";
import {
  CliError,
  pathExists,
  readJson,
  repoRoot,
  writeJson,
} from "./utils.mjs";

export const INSTALL_STATE_FILE = ".ai-check-template.json";
export const INSTALL_STATE_SCHEMA_VERSION = 1;

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
}) {
  const packageJson = await readJson(path.join(repoRoot, "package.json"));
  const parsedProfile = normalizeProfile(profile);
  const normalizedPackageManager = validatePackageManager(packageManager);

  return {
    schemaVersion: INSTALL_STATE_SCHEMA_VERSION,
    packageName: packageJson.name ?? PACKAGE_NAME,
    packageVersion: packageJson.version ?? "0.0.0",
    profile: serializeProfile(parsedProfile),
    packageManager: normalizedPackageManager,
    ci,
    claudeHooks: Boolean(claudeHooks),
    reviewTemplates: Boolean(reviewTemplates),
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
  const profileInput = options.explicit.profile
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

export function effectiveOptionsSummary(effectiveOptions) {
  return {
    profile: effectiveOptions.profile.all.join("+"),
    profiles: serializeProfile(effectiveOptions.profile),
    packageManager: effectiveOptions.packageManager,
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

  if (state.schemaVersion !== INSTALL_STATE_SCHEMA_VERSION) {
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

  const reviewTemplates = state.reviewTemplates === undefined ? false : state.reviewTemplates;
  if (typeof reviewTemplates !== "boolean") {
    return invalidState("invalid-install-state", "Install state reviewTemplates must be a boolean");
  }

  return {
    source: "state",
    state: {
      schemaVersion: state.schemaVersion,
      packageName: state.packageName,
      packageVersion: state.packageVersion,
      profile: serializeProfile(profile),
      packageManager,
      ci: state.ci,
      claudeHooks: state.claudeHooks,
      reviewTemplates,
      managedBy: state.managedBy,
    },
    error: null,
  };
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

function invalidState(code, message) {
  return {
    source: code === "unsupported-install-state" ? "unsupported" : "invalid",
    state: null,
    error: { code, message },
  };
}
