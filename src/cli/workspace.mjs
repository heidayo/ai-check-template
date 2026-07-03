import fs from "node:fs/promises";
import path from "node:path";
import { CliError, pathExists, readJson } from "./utils.mjs";

// SEC-02: values embedded into generated package.json scripts must never carry
// shell metacharacters (spaces, ";", "&", "|", "$", quotes, ...). npm package
// names and workspace-relative directories both fit this conservative set.
const SAFE_SCRIPT_VALUE_PATTERN = /^[A-Za-z0-9@/._-]+$/;

// FR-05 / SEC-01: an install-state (or flag) workspace path must be a relative
// "/"-separated path that stays inside the target directory.
export function isValidWorkspaceStatePath(value) {
  return (
    typeof value === "string"
    && value.length > 0
    && !path.isAbsolute(value)
    && SAFE_SCRIPT_VALUE_PATTERN.test(value)
    && !value.split("/").includes("..")
  );
}

// SEC-01: normalize and validate the --workspace value before any filesystem
// access. Fails fast with CliError; never continues with a warning (FR-02).
function normalizeWorkspaceDir(pkgDir) {
  if (typeof pkgDir !== "string" || pkgDir.length === 0) {
    throw new CliError("--workspace requires a non-empty relative path");
  }

  if (path.isAbsolute(pkgDir)) {
    throw new CliError(`--workspace must be a relative path inside the target directory, got absolute path: ${pkgDir}`);
  }

  if (!SAFE_SCRIPT_VALUE_PATTERN.test(pkgDir)) {
    throw new CliError(
      `--workspace must not contain shell metacharacters or spaces (allowed: letters, digits, "@/._-"): ${pkgDir}`,
    );
  }

  // Normalize to "/"-separated segments and reject traversal. The character
  // check above already excludes "\\", so "/" is the only separator here.
  const segments = pkgDir.split("/").filter((segment) => segment !== "" && segment !== ".");

  if (segments.includes("..")) {
    throw new CliError(`--workspace must not contain ".." segments (path must stay inside the target): ${pkgDir}`);
  }

  if (segments.length === 0) {
    // 境界ケース2: "--workspace ." resolves to the target itself.
    throw new CliError(
      "--workspace must point to a package inside the target, not the target itself. "
        + "For a single-package project, drop --workspace.",
    );
  }

  return segments.join("/");
}

// FR-02 (a): the target must actually be a workspace root, detected via
// pnpm-workspace.yaml existence (no YAML parsing, NFR-02) or the "workspaces"
// field (array or { packages: [...] }) in the root package.json.
async function assertWorkspaceRoot(targetDir) {
  if (await pathExists(path.join(targetDir, "pnpm-workspace.yaml"))) {
    return;
  }

  const rootPackageJsonPath = path.join(targetDir, "package.json");
  if (await pathExists(rootPackageJsonPath)) {
    const rootPackageJson = await readJson(rootPackageJsonPath);
    const workspaces = rootPackageJson.workspaces;

    if (Array.isArray(workspaces) || (workspaces && typeof workspaces === "object" && Array.isArray(workspaces.packages))) {
      return;
    }
  }

  throw new CliError(
    `--workspace requires a workspace root as --target, but neither `
      + `pnpm-workspace.yaml nor a "workspaces" field in package.json was found in: ${targetDir}`,
  );
}

// Resolves and validates --workspace <pkg-dir> against the target directory
// (FR-02 / SEC-01 / SEC-02). Returns { dir, name } where dir is the
// "/"-separated relative path and name is the target package's name.
export async function resolveWorkspace(targetDir, pkgDir) {
  const dir = normalizeWorkspaceDir(pkgDir);

  await assertWorkspaceRoot(targetDir);

  const packageDir = path.join(targetDir, ...dir.split("/"));
  let stats = null;
  try {
    stats = await fs.stat(packageDir);
  } catch {
    stats = null;
  }

  if (!stats || !stats.isDirectory()) {
    throw new CliError(`Workspace package directory does not exist in target ${targetDir}: ${dir}`);
  }

  const packageJsonPath = path.join(packageDir, "package.json");
  if (!(await pathExists(packageJsonPath))) {
    throw new CliError(
      `Workspace package must contain a package.json with a non-empty "name": ${packageJsonPath}`,
    );
  }

  const packageJson = await readJson(packageJsonPath);
  const name = packageJson.name;

  if (typeof name !== "string" || name.length === 0) {
    throw new CliError(
      `Workspace package must contain a package.json with a non-empty "name": ${packageJsonPath}`,
    );
  }

  // SEC-02: the package name is embedded into generated scripts; the user's
  // package.json is outside the trust boundary, so validate before embedding.
  if (!SAFE_SCRIPT_VALUE_PATTERN.test(name)) {
    throw new CliError(
      `Workspace package name contains characters that cannot be embedded in scripts `
        + `(allowed: letters, digits, "@/._-"): ${name}`,
    );
  }

  return { dir, name };
}
