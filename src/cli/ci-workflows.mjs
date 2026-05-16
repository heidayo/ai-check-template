import fs from "node:fs/promises";
import path from "node:path";
import { scriptCommand, validatePackageManager } from "./package-manager.mjs";
import { fromTemplates } from "./utils.mjs";

export const DIRECT_CI_FILES = ["ai-check.yml", "ai-check-fast.yml"];
export const REUSABLE_CI_FILES = ["ai-quality-reusable.yml", "ai-quality-call.yml"];

const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"];

const PNPM_SETUP_BLOCK = `      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile`;

const SETUP_BLOCKS = {
  pnpm: PNPM_SETUP_BLOCK,
  npm: `      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci`,
  yarn: `      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: yarn

      - name: Enable Corepack
        run: corepack enable

      - name: Install dependencies
        run: yarn install --immutable`,
  bun: `      - uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install --frozen-lockfile`,
};

export function ciWorkflowFiles(ciMode) {
  return ciMode === "direct"
    ? DIRECT_CI_FILES
    : ciMode === "reusable"
      ? REUSABLE_CI_FILES
      : [];
}

export function inactiveCiWorkflowFiles(ciMode) {
  return ciMode === "direct"
    ? REUSABLE_CI_FILES
    : ciMode === "reusable"
      ? DIRECT_CI_FILES
      : [...DIRECT_CI_FILES, ...REUSABLE_CI_FILES];
}

export function ciWorkflowRelativePath(fileName) {
  return path.join(".github", "workflows", fileName);
}

export async function renderedCiWorkflow(fileName, packageManager) {
  const validatedPackageManager = validatePackageManager(packageManager);
  const source = await fs.readFile(fromTemplates("ci-examples", "github-actions", fileName), "utf8");

  if (DIRECT_CI_FILES.includes(fileName)) {
    return renderDirectWorkflow(source, fileName, validatedPackageManager);
  }

  if (fileName === "ai-quality-call.yml") {
    return renderReusableCaller(source, validatedPackageManager);
  }

  return source;
}

export async function isManagedCiWorkflowContent(fileName, content) {
  const variants = await Promise.all(
    PACKAGE_MANAGERS.map((packageManager) => renderedCiWorkflow(fileName, packageManager)),
  );

  return variants.includes(content);
}

function renderDirectWorkflow(source, fileName, packageManager) {
  const scriptName = fileName === "ai-check-fast.yml" ? "ai:check:fast" : "ai:check";
  const checkCommand = scriptCommand(packageManager, scriptName);

  return source
    .replace(PNPM_SETUP_BLOCK, SETUP_BLOCKS[packageManager])
    .replaceAll(`pnpm ${scriptName}`, checkCommand);
}

function renderReusableCaller(source, packageManager) {
  return source
    .replace("package-manager: pnpm", `package-manager: ${packageManager}`)
    .replace("check-command: pnpm ai:check", `check-command: ${scriptCommand(packageManager, "ai:check")}`);
}
