import path from "node:path";
import fs from "node:fs/promises";
import { CliError, pathExists } from "./utils.mjs";

export const DEFAULT_PACKAGE_MANAGER = "pnpm";

const VALID_PACKAGE_MANAGERS = new Set(["pnpm", "npm", "yarn", "bun"]);

const LOCKFILE_PACKAGE_MANAGERS = [
  ["pnpm-lock.yaml", "pnpm"],
  ["package-lock.json", "npm"],
  ["npm-shrinkwrap.json", "npm"],
  ["yarn.lock", "yarn"],
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
];

export function validatePackageManager(packageManager) {
  if (!VALID_PACKAGE_MANAGERS.has(packageManager)) {
    throw new CliError(
      `--package-manager must be one of: ${[...VALID_PACKAGE_MANAGERS].join(", ")}`,
    );
  }

  return packageManager;
}

export async function detectPackageManager(targetDir) {
  const packageManager = await packageManagerFromPackageJson(targetDir);
  if (packageManager) {
    return packageManager;
  }

  for (const [lockfile, detectedPackageManager] of LOCKFILE_PACKAGE_MANAGERS) {
    if (await pathExists(path.join(targetDir, lockfile))) {
      return detectedPackageManager;
    }
  }

  return DEFAULT_PACKAGE_MANAGER;
}

export function scriptCommand(packageManager, scriptName) {
  const validated = validatePackageManager(packageManager);

  if (validated === "npm") {
    return `npm run ${scriptName}`;
  }

  if (validated === "bun") {
    return `bun run ${scriptName}`;
  }

  return `${validated} ${scriptName}`;
}

// Workspace-scoped invocation per package manager (SPEC-0061 FR-03), verified
// against the official docs on 2026-07-03:
// - pnpm: `pnpm --filter <name> <script>` (pnpm.io/filtering)
// - npm:  `npm run <script> --workspace <dir>` (docs.npmjs.com/cli/using-npm/workspaces)
// - yarn: `yarn workspace <name> <script>` (yarnpkg.com/cli/workspace; classic v1 identical)
// - bun:  `bun run --filter <name> <script>` (bun.sh/docs/cli/filter, supported since bun v1.1.4)
export function workspaceScriptCommand(packageManager, workspace, scriptName) {
  const validated = validatePackageManager(packageManager);

  if (validated === "npm") {
    return `npm run ${scriptName} --workspace ${workspace.dir}`;
  }

  if (validated === "yarn") {
    return `yarn workspace ${workspace.name} ${scriptName}`;
  }

  if (validated === "bun") {
    return `bun run --filter ${workspace.name} ${scriptName}`;
  }

  return `pnpm --filter ${workspace.name} ${scriptName}`;
}

async function packageManagerFromPackageJson(targetDir) {
  const packageJsonPath = path.join(targetDir, "package.json");

  if (!(await pathExists(packageJsonPath))) {
    return null;
  }

  let packageJson;
  try {
    packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  } catch {
    return null;
  }
  const value = packageJson.packageManager;

  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const [name] = value.split("@");
  return validatePackageManager(name);
}
