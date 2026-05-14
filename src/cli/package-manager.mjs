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
