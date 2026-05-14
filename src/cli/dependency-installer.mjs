import { spawnSync } from "node:child_process";
import { validatePackageManager } from "./package-manager.mjs";
import { parseProfiles } from "./profile.mjs";
import { CliError, readJson } from "./utils.mjs";

const DEPENDENCY_SECTIONS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

const COMMON_DEV_DEPENDENCIES = [
  "typescript",
  "eslint",
  "vitest",
  "knip",
];

const BASE_PROFILE_DEV_DEPENDENCIES = {
  "react-nextjs": [
    ...COMMON_DEV_DEPENDENCIES,
    "@playwright/test",
  ],
  "react-vanilla": COMMON_DEV_DEPENDENCIES,
  "expo-rn": COMMON_DEV_DEPENDENCIES,
  "node-cli": COMMON_DEV_DEPENDENCIES,
};

const ADDON_PROFILE_DEV_DEPENDENCIES = {
  "supabase-rls": [],
};

export async function planDependencyInstall(packageJsonPath, profileInput, packageManagerInput) {
  const packageJson = await readJson(packageJsonPath);
  const packageManager = validatePackageManager(packageManagerInput);
  const dependencies = getProfileDevDependencies(profileInput);
  const missingDependencies = dependencies.filter((dependency) => !isDependencyDeclared(packageJson, dependency));
  const command = buildInstallCommand(packageManager, missingDependencies);

  return {
    packageManager,
    dependencies,
    missingDependencies,
    ...command,
  };
}

export function getProfileDevDependencies(input = "react-nextjs") {
  const profile = typeof input === "string" ? parseProfiles(input) : input;
  const dependencies = new Set(BASE_PROFILE_DEV_DEPENDENCIES[profile.base] ?? []);

  for (const addon of profile.addons ?? []) {
    for (const dependency of ADDON_PROFILE_DEV_DEPENDENCIES[addon] ?? []) {
      dependencies.add(dependency);
    }
  }

  return [...dependencies];
}

export function dependencyInstallOperation(plan, options = {}) {
  const { dryRun = false, path = "package.json" } = options;

  if (plan.missingDependencies.length === 0) {
    return {
      action: "keep",
      path,
      detail: "dev dependencies already declared",
    };
  }

  return {
    action: dryRun ? "would-install" : "install",
    path,
    detail: `dev dependencies ${plan.missingDependencies.join(" ")}`,
    command: plan.commandText,
  };
}

export function preflightDependencyInstaller(plan, cwd) {
  if (plan.missingDependencies.length === 0) {
    return;
  }

  const result = spawnSync(plan.command, ["--version"], {
    cwd,
    encoding: "utf8",
    shell: false,
  });

  if (result.error) {
    throw new CliError(`Package manager command not found for --install-deps: ${plan.command}`);
  }

  if (result.status !== 0) {
    throw new CliError(
      `Package manager preflight failed for --install-deps: ${plan.command} --version\n${formatSpawnOutput(result)}`,
    );
  }
}

export function runDependencyInstall(plan, cwd) {
  if (plan.missingDependencies.length === 0) {
    return;
  }

  const result = spawnSync(plan.command, plan.args, {
    cwd,
    encoding: "utf8",
    shell: false,
  });

  if (result.error) {
    throw new CliError(`Dependency install command failed to start: ${plan.commandText}`);
  }

  if (result.status !== 0) {
    throw new CliError(`Dependency install command failed: ${plan.commandText}\n${formatSpawnOutput(result)}`);
  }
}

function buildInstallCommand(packageManager, dependencies) {
  const command = validatePackageManager(packageManager);
  const args = installArgs(command, dependencies);

  return {
    command,
    args,
    commandText: [command, ...args].join(" "),
  };
}

function installArgs(packageManager, dependencies) {
  if (dependencies.length === 0) {
    return [];
  }

  if (packageManager === "pnpm") {
    return ["add", "-D", ...dependencies];
  }

  if (packageManager === "npm") {
    return ["install", "--save-dev", ...dependencies];
  }

  if (packageManager === "yarn") {
    return ["add", "--dev", ...dependencies];
  }

  return ["add", "--dev", ...dependencies];
}

function isDependencyDeclared(packageJson, dependency) {
  return DEPENDENCY_SECTIONS.some((section) => (
    packageJson[section] &&
    typeof packageJson[section] === "object" &&
    Object.hasOwn(packageJson[section], dependency)
  ));
}

function formatSpawnOutput(result) {
  return [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
}
