import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const binPath = path.join(repoRoot, "bin", "ai-check-template.mjs");
const PNPM_SECURE_SCRIPT = "pnpm security:secrets && pnpm security:deps && pnpm security:supply-chain && pnpm security:sast";
const NPM_SECURE_SCRIPT = "npm run security:secrets && npm run security:deps && npm run security:supply-chain && npm run security:sast";

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [binPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
}

function createTempDir(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

function createFixture(t) {
  const dir = createTempDir(t, "ai-check-template-update-");
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify({ name: "fixture", scripts: {} }, null, 2)}\n`);
  return dir;
}

function initFixture(target, args = []) {
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--yes", ...args]);
  assert.equal(result.status, 0, result.stderr);
}

function doctor(target, args = []) {
  return runCli(["doctor", "--target", target, ...args]);
}

function mergePackageScripts(target, scripts) {
  const packageJsonPath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts = { ...(packageJson.scripts ?? {}), ...scripts };
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function addStrictSupportScripts(target) {
  mergePackageScripts(target, {
    typecheck: "tsc --noEmit",
    lint: "eslint .",
    test: "vitest run",
    "test:unit": "vitest run --dir tests/unit",
    "test:e2e:smoke": "playwright test --grep smoke",
  });
}

function createFakePackageManager(t, name) {
  const binDir = createTempDir(t, "ai-check-template-bin-");
  const logPath = path.join(binDir, "package-manager.log");
  const commandPath = path.join(binDir, name);
  fs.writeFileSync(
    commandPath,
    "#!/bin/sh\nprintf '%s\\n' \"$0 $*\" >> \"$AI_CHECK_PM_LOG\"\n",
  );
  fs.chmodSync(commandPath, 0o755);
  return { binDir, logPath };
}

function snapshotDirectory(dir) {
  const snapshot = {};
  for (const filePath of listFiles(dir)) {
    snapshot[path.relative(dir, filePath)] = fs.readFileSync(filePath, "utf8");
  }
  return snapshot;
}

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

function driftScriptAndFile(target) {
  const packageJsonPath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts["ai:check"] = "custom";
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  fs.writeFileSync(path.join(target, "scripts", "ai-check.sh"), "changed\n");
}

function readInstallState(target) {
  return JSON.parse(fs.readFileSync(path.join(target, ".ai-check-template.json"), "utf8"));
}

function readWorkflow(target, name) {
  return fs.readFileSync(path.join(target, ".github", "workflows", name), "utf8");
}

function readClaudeSettings(target) {
  return JSON.parse(fs.readFileSync(path.join(target, ".claude", "settings.json"), "utf8"));
}

function writeClaudeSettings(target, settings) {
  const settingsPath = path.join(target, ".claude", "settings.json");
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
}

function claudeHookCommands(settings) {
  return Object.values(settings.hooks ?? {}).flatMap((entries) => (
    entries.flatMap((entry) => (entry.hooks ?? []).map((hook) => hook.command).filter(Boolean))
  ));
}

test("prints update help", () => {
  const result = runCli(["update", "--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ai-check-template update/);
  assert.match(result.stdout, /--dry-run/);
  assert.match(result.stdout, /--package-manager/);
  assert.match(result.stdout, /--install-deps/);
  assert.match(result.stdout, /--review-templates/);
});

test("update repairs package scripts and shell scripts then doctor passes", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  driftScriptAndFile(target);
  assert.notEqual(doctor(target, ["--ci", "none"]).status, 0);

  const update = runCli(["update", "--target", target, "--ci", "none", "--yes"]);

  assert.equal(update.status, 0, update.stderr);
  assert.match(update.stdout, /update/);
  assert.equal(doctor(target, ["--ci", "none"]).status, 0);
});

test("update handles direct CI, reusable CI, and Claude hooks", (t) => {
  const directTarget = createFixture(t);
  const direct = runCli(["update", "--target", directTarget, "--ci", "direct", "--yes"]);
  assert.equal(direct.status, 0, direct.stderr);
  assert.equal(doctor(directTarget, ["--ci", "direct"]).status, 0);

  const reusableTarget = createFixture(t);
  const reusable = runCli(["update", "--target", reusableTarget, "--ci", "reusable", "--yes"]);
  assert.equal(reusable.status, 0, reusable.stderr);
  assert.equal(doctor(reusableTarget, ["--ci", "reusable"]).status, 0);

  const claudeTarget = createFixture(t);
  const claude = runCli(["update", "--target", claudeTarget, "--ci", "none", "--claude-hooks", "--yes"]);
  assert.equal(claude.status, 0, claude.stderr);
  assert.equal(doctor(claudeTarget, ["--ci", "none", "--claude-hooks"]).status, 0);
});

test("update uses install state defaults and refreshes state", (t) => {
  const target = createFixture(t);
  const init = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "react-nextjs+supabase-rls",
    "--ci",
    "reusable",
    "--claude-hooks",
    "--review-templates",
    "--yes",
  ]);
  assert.equal(init.status, 0, init.stderr);
  fs.writeFileSync(path.join(target, ".github", "workflows", "ai-quality-call.yml"), "changed\n");
  fs.writeFileSync(path.join(target, ".github", "PULL_REQUEST_TEMPLATE.md"), "changed\n");

  const update = runCli(["update", "--target", target, "--yes", "--json"]);

  assert.equal(update.status, 0, update.stderr);
  // AC-03 / FR-02 / INV-01: baseline から改変された managed ファイルは
  // デフォルトで上書きされず skip-modified として報告される
  const updateOutput = JSON.parse(update.stdout);
  assert.equal(updateOutput.operations.some(
    (operation) => operation.action === "skip-modified" && operation.path === ".github/PULL_REQUEST_TEMPLATE.md",
  ), true);
  assert.equal(updateOutput.operations.some(
    (operation) => operation.action === "skip-modified" && operation.path === ".github/workflows/ai-quality-call.yml",
  ), true);
  assert.equal(fs.readFileSync(path.join(target, ".github", "PULL_REQUEST_TEMPLATE.md"), "utf8"), "changed\n");
  // FR-06: modified-local は warning なので非 strict doctor は pass する
  assert.equal(doctor(target).status, 0);
  const state = readInstallState(target);
  assert.equal(state.profile.base, "react-nextjs");
  assert.deepEqual(state.profile.addons, ["supabase-rls"]);
  assert.equal(state.packageManager, "pnpm");
  assert.equal(state.ci, "reusable");
  assert.equal(state.claudeHooks, true);
  assert.equal(state.reviewTemplates, true);
});

test("update repairs scripts using install state package manager", (t) => {
  const target = createFixture(t);
  const init = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "node-cli",
    "--package-manager",
    "npm",
    "--ci",
    "none",
    "--yes",
  ]);
  assert.equal(init.status, 0, init.stderr);
  const packageJsonPath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts["ai:check"] = "custom";
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const result = runCli(["update", "--target", target, "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.effectiveOptions.packageManager, "npm");
  const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  assert.equal(updatedPackageJson.scripts["ai:check"], "npm run typecheck && npm run lint && npm run deadcode && npm run test");
  assert.equal(updatedPackageJson.scripts["ai:check:secure"], NPM_SECURE_SCRIPT);
  assert.equal(updatedPackageJson.scripts["security:deps"], "npm audit --audit-level high");
  assert.equal(updatedPackageJson.scripts["security:supply-chain"], "npm audit signatures");
  assert.equal(doctor(target).status, 0);
});

// AC-03 / FR-02: 3-way の update 分岐（local == baseline かつ upstream が変化）は
// 現行どおり upstream で更新される
test("update migrates managed direct CI workflows to explicit package manager", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--package-manager", "pnpm", "--ci", "direct"]);

  const result = runCli([
    "update",
    "--target",
    target,
    "--package-manager",
    "npm",
    "--ci",
    "direct",
    "--yes",
    "--json",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.operations.some(
    (operation) => operation.action === "update" && operation.path === ".github/workflows/ai-check.yml",
  ), true);
  assert.match(readWorkflow(target, "ai-check.yml"), /run: npm ci$/m);
  assert.match(readWorkflow(target, "ai-check.yml"), /run: npm run ai:check$/m);
  assert.match(readWorkflow(target, "ai-check-fast.yml"), /run: npm run ai:check:fast$/m);
});

test("update migrates Claude hooks to explicit package manager and preserves custom commands", (t) => {
  const target = createFixture(t);
  const init = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "react-nextjs",
    "--package-manager",
    "pnpm",
    "--ci",
    "none",
    "--claude-hooks",
    "--yes",
  ]);
  assert.equal(init.status, 0, init.stderr);
  const settings = readClaudeSettings(target);
  settings.hooks.PostToolUse[0].hooks.push({ type: "command", command: "custom fast check" });
  writeClaudeSettings(target, settings);

  const result = runCli([
    "update",
    "--target",
    target,
    "--package-manager",
    "npm",
    "--ci",
    "none",
    "--claude-hooks",
    "--yes",
    "--json",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.effectiveOptions.packageManager, "npm");
  assert.equal(output.operations.some(
    (operation) => operation.action === "update" && operation.detail === "Claude hook PostToolUse",
  ), true);
  assert.deepEqual(claudeHookCommands(readClaudeSettings(target)), [
    "npm run ai:check:fast",
    "custom fast check",
    "npm run ai:check",
  ]);
});

test("update dry-run reports Claude hook migration without writing", (t) => {
  const target = createFixture(t);
  const init = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "react-nextjs",
    "--package-manager",
    "pnpm",
    "--ci",
    "none",
    "--claude-hooks",
    "--yes",
  ]);
  assert.equal(init.status, 0, init.stderr);
  const before = readClaudeSettings(target);

  const result = runCli([
    "update",
    "--target",
    target,
    "--package-manager",
    "npm",
    "--ci",
    "none",
    "--claude-hooks",
    "--dry-run",
    "--json",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.operations.some(
    (operation) => operation.action === "would-update" && operation.detail === "Claude hook PostToolUse",
  ), true);
  assert.deepEqual(readClaudeSettings(target), before);
});

test("update migrates generic scripts to node-cli profile scripts", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const result = runCli(["update", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const packageJson = JSON.parse(fs.readFileSync(path.join(target, "package.json"), "utf8"));
  assert.equal(packageJson.scripts["ai:check"], "pnpm typecheck && pnpm lint && pnpm deadcode && pnpm test");
  assert.equal(packageJson.scripts["ai:check:secure"], PNPM_SECURE_SCRIPT);
  assert.equal(packageJson.scripts["ai:check"].includes("test:e2e:smoke"), false);
  assert.equal(doctor(target, ["--profile", "node-cli", "--ci", "none"]).status, 0);
});

test("update creates missing support scripts without overwriting custom scripts", (t) => {
  const target = createFixture(t);
  mergePackageScripts(target, {
    test: "node --test",
    lint: "custom lint",
  });

  const result = runCli(["update", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.operations.some(
    (operation) => operation.action === "create" && operation.detail === "support script typecheck",
  ), true);
  const packageJson = JSON.parse(fs.readFileSync(path.join(target, "package.json"), "utf8"));
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.equal(packageJson.scripts.lint, "custom lint");
  assert.equal(packageJson.scripts.test, "node --test");
  assert.equal(packageJson.scripts["test:unit"], "vitest run --dir tests/unit");
  assert.equal(doctor(target, ["--profile", "node-cli", "--ci", "none", "--strict"]).status, 0);
});

test("update creates missing profile docs without overwriting existing docs", (t) => {
  const target = createFixture(t);
  const existingDocPath = path.join(target, "docs", "ai-check-template", "docs", "test-design-template.md");
  fs.mkdirSync(path.dirname(existingDocPath), { recursive: true });
  fs.writeFileSync(existingDocPath, "custom test design\n");

  const result = runCli(["update", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  // FR-04: baseline hash なし（install state なし）で差分がある既存ファイルは
  // 上書きせず skip-modified として報告される（安全側フォールバック）
  assert.equal(output.operations.some(
    (operation) => (
      operation.action === "skip-modified" &&
      operation.path === "docs/ai-check-template/docs/test-design-template.md"
    ),
  ), true);
  assert.equal(output.operations.some(
    (operation) => (
      operation.action === "create" &&
      operation.path === "docs/ai-check-template/profiles/node-cli/README.md" &&
      operation.detail === "profile doc"
    ),
  ), true);
  assert.equal(fs.readFileSync(existingDocPath, "utf8"), "custom test design\n");
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "profiles", "node-cli", "README.md")), true);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "profiles", "react-nextjs", "README.md")), false);
});

test("update creates reviewability templates when requested", (t) => {
  const target = createFixture(t);
  const result = runCli(["update", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--review-templates", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.effectiveOptions.reviewTemplates, true);
  assert.equal(output.operations.some(
    (operation) => operation.action === "create" && operation.path === ".github/PULL_REQUEST_TEMPLATE.md",
  ), true);
  assert.equal(output.operations.some(
    (operation) => operation.action === "create" && operation.path === "worksheet/ai-code-understanding.md",
  ), true);
  assert.match(fs.readFileSync(path.join(target, ".github", "PULL_REQUEST_TEMPLATE.md"), "utf8"), /AI-Generated Code Review/);
  assert.match(fs.readFileSync(path.join(target, "worksheet", "ai-code-understanding.md"), "utf8"), /Reimplementation Check/);
  assert.equal(readInstallState(target).reviewTemplates, true);
  assert.equal(doctor(target, ["--ci", "none", "--review-templates"]).status, 0);
});

test("update dry-run reports reviewability templates without writing", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const before = snapshotDirectory(target);

  const result = runCli(["update", "--target", target, "--ci", "none", "--review-templates", "--dry-run", "--json"]);
  const after = snapshotDirectory(target);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.effectiveOptions.reviewTemplates, true);
  assert.equal(output.operations.some(
    (operation) => operation.action === "would-create" && operation.path === ".github/PULL_REQUEST_TEMPLATE.md",
  ), true);
  assert.equal(output.operations.some(
    (operation) => operation.action === "would-create" && operation.path === "worksheet/ai-code-understanding.md",
  ), true);
  assert.deepEqual(after, before);
});

test("update install deps invokes fake package manager and emits json operation", (t) => {
  const target = createFixture(t);
  const fakeNpm = createFakePackageManager(t, "npm");
  const result = runCli(
    [
      "update",
      "--target",
      target,
      "--profile",
      "react-nextjs",
      "--package-manager",
      "npm",
      "--ci",
      "none",
      "--install-deps",
      "--yes",
      "--json",
    ],
    { env: { ...process.env, PATH: fakeNpm.binDir, AI_CHECK_PM_LOG: fakeNpm.logPath } },
  );

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.operations.some(
    (operation) => (
      operation.action === "install" &&
      operation.path === "package.json" &&
      operation.command === "npm install --save-dev typescript eslint vitest knip @playwright/test"
    ),
  ), true);
  const log = fs.readFileSync(fakeNpm.logPath, "utf8");
  assert.match(log, /npm --version/);
  assert.match(log, /npm install --save-dev typescript eslint vitest knip @playwright\/test/);
});

test("dry-run writes nothing and emits operations", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  driftScriptAndFile(target);
  const before = snapshotDirectory(target);
  const result = runCli(["update", "--target", target, "--ci", "none", "--dry-run"]);
  const after = snapshotDirectory(target);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /dry-run/);
  assert.match(result.stdout, /would-update/);
  assert.match(result.stdout, /\.ai-check-template\.json/);
  assert.deepEqual(after, before);
});

test("dry-run reports managed CI cleanup without writing", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "direct"]);
  const before = snapshotDirectory(target);

  const result = runCli(["update", "--target", target, "--ci", "none", "--dry-run", "--json"]);
  const after = snapshotDirectory(target);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(
    output.operations
      .filter((operation) => operation.action === "would-delete")
      .map((operation) => operation.path)
      .sort(),
    [".github/workflows/ai-check-fast.yml", ".github/workflows/ai-check.yml"],
  );
  assert.deepEqual(after, before);
});

test("update removes inactive managed CI workflows for ci none", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "direct"]);

  const result = runCli(["update", "--target", target, "--ci", "none", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(
    output.operations
      .filter((operation) => operation.action === "delete")
      .map((operation) => operation.path)
      .sort(),
    [".github/workflows/ai-check-fast.yml", ".github/workflows/ai-check.yml"],
  );
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-check.yml")), false);
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-check-fast.yml")), false);
  addStrictSupportScripts(target);
  assert.equal(doctor(target, ["--ci", "none", "--strict"]).status, 0);
});

test("update removes inactive managed CI workflows rendered for non-pnpm package manager", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--package-manager", "npm", "--ci", "direct"]);

  const result = runCli(["update", "--target", target, "--ci", "none", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(
    output.operations
      .filter((operation) => operation.action === "delete")
      .map((operation) => operation.path)
      .sort(),
    [".github/workflows/ai-check-fast.yml", ".github/workflows/ai-check.yml"],
  );
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-check.yml")), false);
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-check-fast.yml")), false);
});

test("update switches managed direct CI workflows to reusable workflows", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "direct"]);

  const result = runCli(["update", "--target", target, "--ci", "reusable", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-check.yml")), false);
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-check-fast.yml")), false);
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-quality-reusable.yml")), true);
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-quality-call.yml")), true);
  addStrictSupportScripts(target);
  assert.equal(doctor(target, ["--ci", "reusable", "--strict"]).status, 0);
});

test("update preserves custom inactive CI workflows", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.mkdirSync(path.join(target, ".github", "workflows"), { recursive: true });
  const customWorkflowPath = path.join(target, ".github", "workflows", "ai-check.yml");
  fs.writeFileSync(customWorkflowPath, "name: custom\n");

  const result = runCli(["update", "--target", target, "--ci", "none", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.operations.some(
    (operation) => operation.action === "keep" && operation.path === ".github/workflows/ai-check.yml",
  ), true);
  assert.equal(fs.readFileSync(customWorkflowPath, "utf8"), "name: custom\n");
});

test("dry-run reports supabase addon script migrations without writing", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "none"]);
  const before = snapshotDirectory(target);
  const result = runCli([
    "update",
    "--target",
    target,
    "--profile",
    "react-nextjs+supabase-rls",
    "--ci",
    "none",
    "--dry-run",
    "--json",
  ]);
  const after = snapshotDirectory(target);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "dry-run");
  assert.equal(output.operations.some((operation) => operation.detail === "script test:db"), true);
  assert.equal(output.operations.some((operation) => operation.detail === "script test:integration:rls"), true);
  assert.deepEqual(after, before);
});

test("json output is parseable", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  driftScriptAndFile(target);
  const result = runCli(["update", "--target", target, "--ci", "none", "--dry-run", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "dry-run");
  assert.equal(output.installation.source, "state");
  assert.equal(output.effectiveOptions.profile, "react-nextjs");
  assert.equal(output.effectiveOptions.packageManager, "pnpm");
  assert.equal(output.effectiveOptions.ci, "none");
  assert.equal(output.effectiveOptions.reviewTemplates, false);
  assert.equal(output.operations.some((operation) => operation.action === "would-update"), true);
});

test("explicit update flags override install state", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const result = runCli([
    "update",
    "--target",
    target,
    "--profile",
    "node-cli",
    "--ci",
    "reusable",
    "--claude-hooks",
    "--review-templates",
    "--yes",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const state = readInstallState(target);
  assert.equal(state.profile.base, "node-cli");
  assert.deepEqual(state.profile.addons, []);
  assert.equal(state.packageManager, "pnpm");
  assert.equal(state.ci, "reusable");
  assert.equal(state.claudeHooks, true);
  assert.equal(state.reviewTemplates, true);
});

test("update without yes is rejected and does not write", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  driftScriptAndFile(target);
  const before = snapshotDirectory(target);
  const result = runCli(["update", "--target", target, "--ci", "none"]);
  const after = snapshotDirectory(target);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Refusing to write without --yes/);
  assert.deepEqual(after, before);
});

test("unmanaged files are unchanged", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.writeFileSync(path.join(target, "notes.txt"), "keep me\n");
  driftScriptAndFile(target);

  const result = runCli(["update", "--target", target, "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(target, "notes.txt"), "utf8"), "keep me\n");
});

test("update rejects target without package.json", (t) => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-empty-"));
  t.after(() => {
    fs.rmSync(target, { recursive: true, force: true });
  });
  const result = runCli(["update", "--target", target, "--ci", "none", "--yes"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /package\.json/);
});

// 異常系3: install state の JSON 破損 → validation エラーで停止（silent 破壊をしない）
test("update rejects malformed install state before writing", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  driftScriptAndFile(target);
  fs.writeFileSync(path.join(target, ".ai-check-template.json"), "{bad json\n");
  const before = snapshotDirectory(target);
  const result = runCli(["update", "--target", target, "--yes"]);
  const after = snapshotDirectory(target);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid install state/);
  assert.deepEqual(after, before);
});

// --- SPEC-0056: managed ファイル hash 記録と 3-way update ---

function writeInstallState(target, state) {
  fs.writeFileSync(path.join(target, ".ai-check-template.json"), `${JSON.stringify(state, null, 2)}\n`);
}

function toV1State(target) {
  const state = readInstallState(target);
  delete state.managedFiles;
  writeInstallState(target, { ...state, schemaVersion: 1 });
}

test("v1 install state で update がエラーなく完走し v2 に migration される", (t) => {
  // AC-05 / FR-05 / POST-01: schemaVersion 1 の state は自動 migration され、
  // update 完了後の state は常に schemaVersion 2 で managedFiles hash を持つ
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  toV1State(target);

  const result = runCli(["update", "--target", target, "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const state = readInstallState(target);
  assert.equal(state.schemaVersion, 2);
  assert.equal(Object.hasOwn(state.managedFiles, "scripts/ai-check.sh"), true);
  assert.match(state.managedFiles["scripts/ai-check.sh"].hash, /^sha256:[0-9a-f]{64}$/);
});

test("schemaVersion が 2 より大きい state は明確なエラーで停止する", (t) => {
  // 異常系2 / FR-05 / PRE-01: 未知の schemaVersion (>2) は silent に読み進めず停止
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const state = readInstallState(target);
  writeInstallState(target, { ...state, schemaVersion: 3 });
  const before = snapshotDirectory(target);

  const result = runCli(["update", "--target", target, "--ci", "none", "--yes"]);
  const after = snapshotDirectory(target);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /schemaVersion/);
  assert.deepEqual(after, before);
});

test("改変された managed ファイルは update で上書きされず skip-modified になる", (t) => {
  // AC-03 / FR-02 / INV-01: local != baseline かつ local != upstream の
  // ファイルはデフォルトで上書きされない（3-way: skip-modified 分岐）
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const baselineHash = readInstallState(target).managedFiles["scripts/ai-check.sh"].hash;
  fs.writeFileSync(path.join(target, "scripts", "ai-check.sh"), "my custom check\n");

  const result = runCli(["update", "--target", target, "--ci", "none", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.operations.some(
    (operation) => operation.action === "skip-modified" && operation.path === "scripts/ai-check.sh",
  ), true);
  assert.equal(fs.readFileSync(path.join(target, "scripts", "ai-check.sh"), "utf8"), "my custom check\n");
  // 改変ファイルの baseline hash は維持され、次回 update でも改変扱いになる（INV-01）
  assert.equal(readInstallState(target).managedFiles["scripts/ai-check.sh"].hash, baselineHash);
  // リスク2 軽減策: skip 時に解決フラグの案内を表示する
  assert.equal(output.notes.some((note) => /--force-managed/.test(note) && /--diff/.test(note)), true);
});

test("--keep-local はデフォルトの skip-modified 動作を明示する", (t) => {
  // FR-02: --keep-local は改変ファイル保持（デフォルト動作の明示）
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.writeFileSync(path.join(target, "scripts", "ai-check.sh"), "my custom check\n");

  const result = runCli(["update", "--target", target, "--ci", "none", "--keep-local", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.operations.some(
    (operation) => operation.action === "skip-modified" && operation.path === "scripts/ai-check.sh",
  ), true);
  assert.equal(fs.readFileSync(path.join(target, "scripts", "ai-check.sh"), "utf8"), "my custom check\n");
});

test("--force-managed は改変ファイルを上書きし .bak-<version> を先に生成する", (t) => {
  // AC-04 / FR-03: overwrite-forced 分岐。上書き前の内容が
  // <file>.bak-<packageVersion> として保存される
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.writeFileSync(path.join(target, "scripts", "ai-check.sh"), "my custom check\n");

  const result = runCli(["update", "--target", target, "--ci", "none", "--force-managed", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.operations.some(
    (operation) => operation.action === "overwrite-forced" && operation.path === "scripts/ai-check.sh",
  ), true);
  const backupPath = path.join(target, "scripts", "ai-check.sh.bak-0.4.0");
  assert.equal(fs.readFileSync(backupPath, "utf8"), "my custom check\n");
  assert.notEqual(fs.readFileSync(path.join(target, "scripts", "ai-check.sh"), "utf8"), "my custom check\n");
  // SEC-02: .bak 生成時に .gitignore への追加検討を案内する
  assert.equal(output.notes.some((note) => /\.gitignore/.test(note)), true);
  // 上書き後は doctor が pass する（upstream と一致）
  assert.equal(doctor(target, ["--ci", "none"]).status, 0);
});

test(".bak 書き込みに失敗した場合は元ファイルが無傷のまま残る", (t) => {
  // INV-05: .bak-<version> が先に書き込まれてから上書きが行われる。
  // .bak 書込失敗（同名ディレクトリ）時は元ファイルの内容が変更されない
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.writeFileSync(path.join(target, "scripts", "ai-check.sh"), "my custom check\n");
  fs.mkdirSync(path.join(target, "scripts", "ai-check.sh.bak-0.4.0"));

  const result = runCli(["update", "--target", target, "--ci", "none", "--force-managed", "--yes"]);

  assert.notEqual(result.status, 0);
  assert.equal(fs.readFileSync(path.join(target, "scripts", "ai-check.sh"), "utf8"), "my custom check\n");
});

test("managedFiles 記録があるのにファイルが欠落している場合は再生成される", (t) => {
  // 異常系1: 記録あり + ファイル削除 → update は create（再生成）で報告する
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.rmSync(path.join(target, "scripts", "ai-check.sh"));

  const result = runCli(["update", "--target", target, "--ci", "none", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.operations.some(
    (operation) => operation.action === "create" && operation.path === "scripts/ai-check.sh",
  ), true);
  assert.equal(fs.existsSync(path.join(target, "scripts", "ai-check.sh")), true);
});

test("baseline hash なし + 差分ありは警告付きで keep され hash は記録されない", (t) => {
  // FR-04: v1 state（baseline なし）からの migration 直後はバイト比較に
  // フォールバックし、差分ありでも上書きしない。差分あり skip したファイルは
  // baseline hash を記録せず、フォールバック警告を継続する（差分なしのみ
  // hash 記録して 3-way に移行）
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  toV1State(target);
  fs.writeFileSync(path.join(target, "scripts", "ai-check.sh"), "my custom check\n");

  const result = runCli(["update", "--target", target, "--ci", "none", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.operations.some(
    (operation) => operation.action === "skip-modified" && operation.path === "scripts/ai-check.sh",
  ), true);
  assert.equal(fs.readFileSync(path.join(target, "scripts", "ai-check.sh"), "utf8"), "my custom check\n");
  const state = readInstallState(target);
  assert.equal(state.schemaVersion, 2);
  // FR-04: 差分あり skip では baseline hash を記録しない
  assert.equal(state.managedFiles["scripts/ai-check.sh"]?.hash, undefined);
});

test("baseline なし + 改変は 2 回目の update でも skip-modified で内容が保持される", (t) => {
  // INV-01 / FR-04: FIND-001 回帰。差分あり skip 時に upstream hash を記録して
  // しまうと 2 回目の update で「baseline == local 扱い」となりユーザー改変が
  // 上書きされる。差分あり skip では hash を記録しないため、2 回目以降も
  // skip-modified が継続しユーザー内容が失われない
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  toV1State(target);
  fs.writeFileSync(path.join(target, "scripts", "ai-check.sh"), "my custom check\n");

  const first = runCli(["update", "--target", target, "--ci", "none", "--yes", "--json"]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(JSON.parse(first.stdout).operations.some(
    (operation) => operation.action === "skip-modified" && operation.path === "scripts/ai-check.sh",
  ), true);

  const second = runCli(["update", "--target", target, "--ci", "none", "--yes", "--json"]);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(JSON.parse(second.stdout).operations.some(
    (operation) => operation.action === "skip-modified" && operation.path === "scripts/ai-check.sh",
  ), true);
  // INV-01: ユーザー内容がデータ喪失せず保持される
  assert.equal(fs.readFileSync(path.join(target, "scripts", "ai-check.sh"), "utf8"), "my custom check\n");
});

test("local == upstream だが baseline と異なる場合は keep して hash を更新する", (t) => {
  // 境界ケース1: ユーザーが手動で upstream を先行適用 → keep + hash を upstream 値に更新
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const state = readInstallState(target);
  const upstreamHash = state.managedFiles["scripts/ai-check.sh"].hash;
  const staleHash = `sha256:${"0".repeat(64)}`;
  state.managedFiles["scripts/ai-check.sh"] = { hash: staleHash };
  writeInstallState(target, state);

  const result = runCli(["update", "--target", target, "--ci", "none", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.operations.some(
    (operation) => operation.action === "keep" && operation.path === "scripts/ai-check.sh",
  ), true);
  assert.equal(readInstallState(target).managedFiles["scripts/ai-check.sh"].hash, upstreamHash);
});

test("--diff は改変ファイルの unified diff を表示し非ゼロで終了、書き込みしない", (t) => {
  // FR-02 解決フラグ: --diff は diff 表示 + 終了コード通知、ファイルは変更しない
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.writeFileSync(path.join(target, "scripts", "ai-check.sh"), "my custom check\n");
  const before = snapshotDirectory(target);

  const result = runCli(["update", "--target", target, "--ci", "none", "--diff"]);
  const after = snapshotDirectory(target);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /scripts\/ai-check\.sh/);
  assert.match(result.stdout, /-my custom check/);
  assert.deepEqual(after, before);
});

test("--diff は改変ファイルがなければゼロで終了する", (t) => {
  // FR-02: 改変なしの --diff は成功終了（CI での改変検知用途）
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);

  const result = runCli(["update", "--target", target, "--ci", "none", "--diff"]);

  assert.equal(result.status, 0, result.stderr);
});

test("未改変プロジェクトの update → doctor は冪等に pass する", (t) => {
  // AC-06 / POST-02: 未改変プロジェクトで update → doctor PASS（冪等性）。
  // operations は全 managed ファイルについて action を含む
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);

  const first = runCli(["update", "--target", target, "--ci", "none", "--yes", "--json"]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(doctor(target, ["--ci", "none"]).status, 0);

  const second = runCli(["update", "--target", target, "--ci", "none", "--yes", "--json"]);
  assert.equal(second.status, 0, second.stderr);
  const output = JSON.parse(second.stdout);
  // POST-02: shell script 3 ファイルすべてに action が報告される
  for (const scriptPath of ["scripts/ai-check.sh", "scripts/ai-check-fast.sh", "scripts/ai-check-secure.sh"]) {
    assert.equal(output.operations.some((operation) => operation.path === scriptPath), true, scriptPath);
  }
  // 冪等性: 2 回目の update で managed ファイルは keep のみ
  assert.equal(output.operations.some(
    (operation) => operation.path.startsWith("scripts/") && operation.action !== "keep",
  ), false);
  assert.equal(doctor(target, ["--ci", "none"]).status, 0);
});

// --- SPEC-0057: local overlay（installer 不干渉領域） ---

function sha256Content(content) {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

// overlay ファイル（scripts/ai-check.local.sh と .claude/rules/local/ 配下）を配置する
function placeOverlayFiles(target) {
  const localScriptPath = path.join(target, "scripts", "ai-check.local.sh");
  const localRulePath = path.join(target, ".claude", "rules", "local", "my-rule.md");
  fs.writeFileSync(localScriptPath, "export PM=npm\necho \"overlay\"\n");
  fs.mkdirSync(path.dirname(localRulePath), { recursive: true });
  fs.writeFileSync(localRulePath, "# my project rule\n");
  return { localScriptPath, localRulePath };
}

function overlaySnapshot(target, paths) {
  const snapshot = {};
  for (const filePath of paths) {
    snapshot[path.relative(target, filePath)] = fs.readFileSync(filePath, "utf8");
  }
  return snapshot;
}

test("update は overlay ファイルを変更・削除せず operations にも含めない", (t) => {
  // AC-03 / FR-02 / FR-04 / INV-02: ai-check.local.sh と .claude/rules/local/
  // 配下のユーザーファイル（README 含む）は update の書き込み・削除対象にならず、
  // operations に managed 対象として現れない
  const target = createFixture(t);
  initFixture(target, ["--ci", "none", "--claude-hooks"]);
  const readmePath = path.join(target, ".claude", "rules", "local", "README.md");
  assert.equal(fs.existsSync(readmePath), true);
  const { localScriptPath, localRulePath } = placeOverlayFiles(target);
  const overlayPaths = [localScriptPath, localRulePath, readmePath];
  const before = overlaySnapshot(target, overlayPaths);

  const result = runCli(["update", "--target", target, "--ci", "none", "--claude-hooks", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  // FR-02 / FR-04: operations に local 系パスが一切現れない
  for (const operation of output.operations) {
    const operationPath = operation.path ?? operation.targetPath ?? "";
    assert.doesNotMatch(operationPath, /ai-check\.local\.sh/, JSON.stringify(operation));
    assert.doesNotMatch(operationPath, /[/\\]rules[/\\]local(?:[/\\]|$)/, JSON.stringify(operation));
  }
  // INV-02: update 前後で overlay ファイルの内容・存在が不変
  assert.deepEqual(overlaySnapshot(target, overlayPaths), before);
  // FR-02: install state（managedFiles）にも記録されない
  const managedKeys = Object.keys(readInstallState(target).managedFiles);
  assert.equal(managedKeys.some((key) => key.includes("ai-check.local.sh")), false);
  assert.equal(managedKeys.some((key) => key.startsWith(".claude/rules/local/")), false);
});

test("overlay ファイルがあっても update → doctor の冪等性が保たれる", (t) => {
  // AC-06（依頼スコープ）/ INV-02 / INV-03: overlay 配置状態でも
  // update → doctor pass → 再 update は keep のみ（冪等）
  const target = createFixture(t);
  initFixture(target, ["--ci", "none", "--claude-hooks"]);
  placeOverlayFiles(target);

  const first = runCli(["update", "--target", target, "--ci", "none", "--claude-hooks", "--yes", "--json"]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(doctor(target, ["--ci", "none", "--claude-hooks"]).status, 0);

  const second = runCli(["update", "--target", target, "--ci", "none", "--claude-hooks", "--yes", "--json"]);
  assert.equal(second.status, 0, second.stderr);
  const output = JSON.parse(second.stdout);
  // 冪等性: 2 回目の update で managed scripts は keep のみ
  assert.equal(output.operations.some(
    (operation) => (operation.path ?? "").startsWith("scripts/") && operation.action !== "keep",
  ), false);
  assert.equal(doctor(target, ["--ci", "none", "--claude-hooks"]).status, 0);
});

test("旧テンプレート scripts は未改変なら source 行入りへ自動更新され改変済みは skip-modified になる", (t) => {
  // AC-06 / NFR-01 / ASM-03: 旧テンプレート（source 行なし）+ v2 install state
  // （旧内容の baseline hash）で update すると、local == baseline の scripts は
  // 3-way 判定により新テンプレート（ai-check.local.sh source 入り）へ自動更新され、
  // 改変済み scripts は skip-modified でユーザー内容が保持される
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);

  // 旧テンプレートを模擬: 現行テンプレートから overlay ブロックを取り除いた内容
  const scriptPath = path.join(target, "scripts", "ai-check.sh");
  const current = fs.readFileSync(scriptPath, "utf8");
  const blockStart = current.indexOf("# local overlay:");
  const blockEnd = current.indexOf("\nfi\n", blockStart) + "\nfi\n".length;
  assert.notEqual(blockStart, -1);
  const oldContent = current.slice(0, blockStart) + current.slice(blockEnd);
  assert.doesNotMatch(oldContent, /ai-check\.local\.sh/);
  fs.writeFileSync(scriptPath, oldContent);

  // 改変済み script を用意（baseline は現行 hash のまま → local != baseline != upstream）
  const modifiedPath = path.join(target, "scripts", "ai-check-fast.sh");
  fs.writeFileSync(modifiedPath, "my custom fast check\n");

  // v2 install state: ai-check.sh の baseline を旧内容の hash に書き換え（local == baseline）
  const state = readInstallState(target);
  state.managedFiles["scripts/ai-check.sh"] = { hash: sha256Content(oldContent) };
  writeInstallState(target, state);

  const result = runCli(["update", "--target", target, "--ci", "none", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  // NFR-01: 未改変（local == baseline）は upstream へ自動更新
  assert.equal(output.operations.some(
    (operation) => operation.action === "update" && operation.path === "scripts/ai-check.sh",
  ), true);
  assert.match(fs.readFileSync(scriptPath, "utf8"), /ai-check\.local\.sh/);
  // NFR-01: 改変済みは skip-modified で保持
  assert.equal(output.operations.some(
    (operation) => operation.action === "skip-modified" && operation.path === "scripts/ai-check-fast.sh",
  ), true);
  assert.equal(fs.readFileSync(modifiedPath, "utf8"), "my custom fast check\n");
});

test("update rejects invalid profile before writing", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const before = snapshotDirectory(target);
  const result = runCli(["update", "--target", target, "--profile", "../bad", "--ci", "none", "--yes"]);
  const after = snapshotDirectory(target);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid profile/);
  assert.deepEqual(after, before);
});
