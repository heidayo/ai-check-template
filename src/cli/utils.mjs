import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export class CliError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
  }
}

const cliDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(cliDir, "../..");
export const packageTemplatesRoot = path.join(repoRoot, "package-templates");

export function writeLine(stream, message = "") {
  const target = stream ?? process.stdout;
  target.write(`${message}\n`);
}

export function resolveTarget(input, cwd = process.cwd()) {
  return path.resolve(cwd, input ?? ".");
}

export function fromTemplates(...segments) {
  return path.join(packageTemplatesRoot, ...segments);
}

export async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson(targetPath) {
  try {
    return JSON.parse(await fs.readFile(targetPath, "utf8"));
  } catch (error) {
    throw new CliError(`Failed to read JSON: ${targetPath}\n${error.message}`);
  }
}

export async function writeJson(targetPath, value, { dryRun = false } = {}) {
  if (dryRun) {
    return;
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function copyFileSafe(sourcePath, targetPath, options = {}) {
  const { dryRun = false, overwrite = false } = options;
  const exists = await pathExists(targetPath);

  if (exists && !overwrite) {
    return { action: "skip", reason: "exists", targetPath };
  }

  if (!dryRun) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }

  if (exists && overwrite) {
    return { action: dryRun ? "would-overwrite" : "overwrite", targetPath };
  }

  return { action: dryRun ? "would-copy" : "copy", targetPath };
}
