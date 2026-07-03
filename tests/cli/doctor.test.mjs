import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const binPath = path.join(repoRoot, "bin", "ai-check-template.mjs");

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [binPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
}

function createFixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-doctor-"));
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify({ name: "fixture", scripts: {} }, null, 2)}\n`);
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

function initFixture(target, args = []) {
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--yes", ...args]);
  assert.equal(result.status, 0, result.stderr);
}

function readWorkflow(target, name) {
  return fs.readFileSync(path.join(target, ".github", "workflows", name), "utf8");
}

function mergePackageScripts(dir, scripts) {
  const packageJsonPath = path.join(dir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts = { ...(packageJson.scripts ?? {}), ...scripts };
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function deletePackageScripts(dir, names) {
  const packageJsonPath = path.join(dir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  for (const name of names) {
    delete packageJson.scripts[name];
  }
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function missingScriptWarningNames(output) {
  return output.warnings
    .filter((warning) => warning.code === "script-advice")
    .map((warning) => warning.message.replace("ai:check references missing package script: ", ""))
    .sort();
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

test("prints doctor help", () => {
  const result = runCli(["doctor", "--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ai-check-template doctor/);
  assert.match(result.stdout, /--json/);
  assert.match(result.stdout, /--strict/);
  assert.match(result.stdout, /--package-manager/);
  assert.match(result.stdout, /--review-templates/);
});

test("doctor passes for a healthy target with scripts only", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const before = snapshotDirectory(target);
  const result = runCli(["doctor", "--target", target, "--ci", "none"]);
  const after = snapshotDirectory(target);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /doctor pass/);
  assert.deepEqual(after, before);
});

test("doctor passes for direct CI, reusable CI, and Claude hooks", (t) => {
  const directTarget = createFixture(t);
  initFixture(directTarget, ["--ci", "direct"]);
  assert.equal(runCli(["doctor", "--target", directTarget, "--ci", "direct"]).status, 0);

  const reusableTarget = createFixture(t);
  initFixture(reusableTarget, ["--ci", "reusable"]);
  assert.equal(runCli(["doctor", "--target", reusableTarget, "--ci", "reusable"]).status, 0);

  const claudeTarget = createFixture(t);
  initFixture(claudeTarget, ["--ci", "none", "--claude-hooks"]);
  assert.equal(runCli(["doctor", "--target", claudeTarget, "--ci", "none", "--claude-hooks"]).status, 0);
});

test("doctor uses package-manager-rendered direct CI workflows", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--package-manager", "npm", "--ci", "direct"]);
  assert.match(readWorkflow(target, "ai-check.yml"), /run: npm run ai:check$/m);

  const pass = runCli(["doctor", "--target", target, "--ci", "direct", "--package-manager", "npm", "--json"]);
  assert.equal(pass.status, 0, pass.stderr);

  const drift = runCli(["doctor", "--target", target, "--ci", "direct", "--package-manager", "pnpm", "--json"]);
  assert.notEqual(drift.status, 0);
  const output = JSON.parse(drift.stdout);
  // FR-06: local == baseline で template だけが変わった場合は drift-upstream（更新未適用）
  assert.equal(output.issues.some(
    (issue) => issue.code === "drift-upstream" && issue.path === ".github/workflows/ai-check.yml",
  ), true);
});

test("doctor warns on inactive managed CI workflows rendered for non-pnpm package manager", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--package-manager", "npm", "--profile", "node-cli", "--ci", "direct"]);

  const result = runCli([
    "doctor",
    "--target",
    target,
    "--profile",
    "node-cli",
    "--package-manager",
    "npm",
    "--ci",
    "none",
    "--json",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(
    output.warnings
      .filter((warning) => warning.code === "ci-advice")
      .map((warning) => warning.path)
      .sort(),
    [".github/workflows/ai-check-fast.yml", ".github/workflows/ai-check.yml"],
  );
});

test("doctor warns on inactive managed CI workflows", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "direct"]);
  const before = snapshotDirectory(target);

  const result = runCli(["doctor", "--target", target, "--profile", "node-cli", "--ci", "none", "--json"]);
  const after = snapshotDirectory(target);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.issues.length, 0);
  assert.deepEqual(
    output.warnings
      .filter((warning) => warning.code === "ci-advice")
      .map((warning) => warning.path)
      .sort(),
    [".github/workflows/ai-check-fast.yml", ".github/workflows/ai-check.yml"],
  );
  assert.deepEqual(after, before);
});

test("strict mode fails on inactive managed CI workflows", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "direct"]);
  const before = snapshotDirectory(target);

  const result = runCli(["doctor", "--target", target, "--profile", "node-cli", "--ci", "none", "--strict", "--json"]);
  const after = snapshotDirectory(target);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.strict, true);
  assert.equal(output.issues.length, 0);
  assert.equal(output.warnings.some((warning) => warning.code === "ci-advice"), true);
  assert.deepEqual(after, before);
});

test("doctor does not warn on custom inactive CI workflow content", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "none"]);
  fs.mkdirSync(path.join(target, ".github", "workflows"), { recursive: true });
  fs.writeFileSync(path.join(target, ".github", "workflows", "ai-check.yml"), "name: custom\n");

  const result = runCli(["doctor", "--target", target, "--profile", "node-cli", "--ci", "none", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.warnings.some((warning) => warning.code === "ci-advice"), false);
});

test("selected CI mode issues remain issues", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "none"]);

  const result = runCli(["doctor", "--target", target, "--profile", "node-cli", "--ci", "direct", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.issues.some(
    (issue) => issue.code === "missing-file" && issue.path === ".github/workflows/ai-check.yml",
  ), true);
});

test("doctor uses install state defaults and reports JSON context", (t) => {
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

  const result = runCli(["doctor", "--target", target, "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.installation.source, "state");
  assert.equal(output.effectiveOptions.profile, "react-nextjs+supabase-rls");
  assert.equal(output.effectiveOptions.packageManager, "pnpm");
  assert.equal(output.effectiveOptions.ci, "reusable");
  assert.equal(output.effectiveOptions.claudeHooks, true);
  assert.equal(output.effectiveOptions.reviewTemplates, true);
  assert.equal(Array.isArray(output.warnings), true);
});

test("doctor checks reviewability templates when explicitly requested", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const before = snapshotDirectory(target);

  const result = runCli(["doctor", "--target", target, "--ci", "none", "--review-templates", "--json"]);
  const after = snapshotDirectory(target);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.effectiveOptions.reviewTemplates, true);
  assert.equal(output.issues.some(
    (issue) => issue.code === "missing-file" && issue.path === ".github/PULL_REQUEST_TEMPLATE.md",
  ), true);
  assert.equal(output.issues.some(
    (issue) => issue.code === "missing-file" && issue.path === "worksheet/ai-code-understanding.md",
  ), true);
  assert.deepEqual(after, before);
});

test("doctor uses install state default for reviewability template drift", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none", "--review-templates"]);
  fs.writeFileSync(path.join(target, "worksheet", "ai-code-understanding.md"), "changed\n");

  const result = runCli(["doctor", "--target", target, "--json"]);

  // FR-06: baseline から改変されたファイルは modified-local（ユーザー改変）として
  // warning で報告され、非 strict では失敗にならない
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.effectiveOptions.reviewTemplates, true);
  assert.equal(output.warnings.some(
    (warning) => warning.code === "modified-local" && warning.path === "worksheet/ai-code-understanding.md",
  ), true);
  assert.equal(output.managedFiles.some(
    (file) => file.status === "modified-local" && file.path === "worksheet/ai-code-understanding.md",
  ), true);
});

test("doctor uses install state package manager for script drift", (t) => {
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

  const result = runCli(["doctor", "--target", target, "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.effectiveOptions.packageManager, "npm");
  assert.equal(output.issues.length, 0);
});

test("doctor accepts old install state without package manager", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const statePath = path.join(target, ".ai-check-template.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  delete state.packageManager;
  delete state.reviewTemplates;
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

  const result = runCli(["doctor", "--target", target, "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.effectiveOptions.packageManager, "pnpm");
  assert.equal(output.effectiveOptions.reviewTemplates, false);
});

test("profile warnings do not fail doctor", (t) => {
  const target = createFixture(t);
  const init = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);
  assert.equal(init.status, 0, init.stderr);
  const packageJsonPath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts["test:e2e:smoke"] = "playwright test";
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const result = runCli(["doctor", "--target", target, "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.strict, false);
  assert.equal(output.issues.length, 0);
  assert.equal(output.warnings.some((warning) => warning.code === "profile-advice"), true);
  assert.doesNotMatch(result.stdout, /pnpm typecheck/);
});

test("doctor warns on missing referenced package scripts", (t) => {
  const target = createFixture(t);
  const init = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);
  assert.equal(init.status, 0, init.stderr);
  deletePackageScripts(target, ["typecheck", "lint", "test", "test:unit"]);
  const before = snapshotDirectory(target);

  const result = runCli(["doctor", "--target", target, "--json"]);
  const after = snapshotDirectory(target);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.deepEqual(
    missingScriptWarningNames(output),
    ["lint", "test", "test:unit", "typecheck"],
  );
  assert.deepEqual(after, before);
});

test("strict mode fails on missing referenced package scripts", (t) => {
  const target = createFixture(t);
  const init = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);
  assert.equal(init.status, 0, init.stderr);
  deletePackageScripts(target, ["typecheck"]);

  const result = runCli(["doctor", "--target", target, "--strict", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.strict, true);
  assert.equal(output.issues.length, 0);
  assert.equal(output.warnings.some((warning) => warning.code === "script-advice"), true);
});

test("doctor does not warn when referenced package scripts exist", (t) => {
  const target = createFixture(t);
  const init = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);
  assert.equal(init.status, 0, init.stderr);
  mergePackageScripts(target, {
    typecheck: "tsc --noEmit",
    lint: "eslint .",
    test: "vitest run",
    "test:unit": "vitest run --dir tests/unit",
  });

  const result = runCli(["doctor", "--target", target, "--strict", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.warnings.some((warning) => warning.code === "script-advice"), false);
});

test("missing script parser supports package manager invocation forms", (t) => {
  const target = createFixture(t);
  const init = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);
  assert.equal(init.status, 0, init.stderr);
  deletePackageScripts(target, ["typecheck", "lint", "test:unit"]);
  mergePackageScripts(target, {
    "ai:check": "npm run typecheck && yarn lint && bun run test:unit && pnpm deadcode",
    "ai:check:fast": "bun run typecheck && pnpm lint",
  });

  const result = runCli(["doctor", "--target", target, "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(
    missingScriptWarningNames(output),
    ["lint", "test:unit", "typecheck"],
  );
});

test("strict mode fails on profile warnings without converting them to issues", (t) => {
  const target = createFixture(t);
  const init = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);
  assert.equal(init.status, 0, init.stderr);
  const packageJsonPath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts["test:e2e:smoke"] = "playwright test";
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  const before = snapshotDirectory(target);

  const result = runCli(["doctor", "--target", target, "--strict", "--json"]);
  const after = snapshotDirectory(target);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.strict, true);
  assert.equal(output.issues.length, 0);
  assert.equal(output.warnings.some((warning) => warning.code === "profile-advice"), true);
  assert.deepEqual(after, before);
});

test("strict mode passes when there are no issues or warnings", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "none"]);
  mergePackageScripts(target, {
    typecheck: "tsc --noEmit",
    lint: "eslint .",
    test: "vitest run",
    "test:unit": "vitest run --dir tests/unit",
  });
  const result = runCli(["doctor", "--target", target, "--strict", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.strict, true);
  assert.equal(output.issues.length, 0);
  assert.equal(output.warnings.length, 0);
});

test("explicit profile controls diagnostics warnings", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);

  const result = runCli(["doctor", "--target", target, "--profile", "node-cli", "--ci", "none", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.effectiveOptions.profile, "node-cli");
  assert.equal(output.issues.some((issue) => issue.message.includes("ai:check")), true);
});

test("doctor passes node-cli profile scripts", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "none"]);
  const result = runCli(["doctor", "--target", target, "--ci", "none"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /doctor pass/);
});

test("doctor allows React Doctor in expo-rn profile", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "expo-rn", "--ci", "none"]);
  const result = runCli(["doctor", "--target", target, "--profile", "expo-rn", "--ci", "none", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.warnings.some((warning) => warning.message.includes("does not support React Doctor")), false);
});

test("doctor detects generic script drift for node-cli profile", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "none"]);
  const packageJsonPath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts["ai:check"] = "pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e:smoke";
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const result = runCli(["doctor", "--target", target, "--ci", "none"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /drift/);
});

test("doctor warns on missing tracked managed files", (t) => {
  // 異常系1: managedFiles に記録があるがファイルが削除されている →
  // doctor は missing として警告（update が再生成する）
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.rmSync(path.join(target, "scripts", "ai-check.sh"));
  const result = runCli(["doctor", "--target", target, "--ci", "none", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.warnings.some(
    (warning) => warning.code === "missing-managed-file" && warning.path === "scripts/ai-check.sh",
  ), true);
  assert.equal(output.managedFiles.some(
    (file) => file.status === "missing" && file.path === "scripts/ai-check.sh",
  ), true);

  // strict では欠落警告も失敗になる
  assert.notEqual(runCli(["doctor", "--target", target, "--ci", "none", "--strict"]).status, 0);
});

test("doctor returns non-zero for missing files without baseline", (t) => {
  // baseline 記録なし（v0.1 手動導入相当）の欠落は現行どおり issue として失敗
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.rmSync(path.join(target, "scripts", "ai-check.sh"));
  fs.rmSync(path.join(target, ".ai-check-template.json"));
  const result = runCli(["doctor", "--target", target, "--ci", "none"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /missing-file/);
  assert.match(result.stdout, /scripts\/ai-check\.sh/);
});

test("doctor returns non-zero for drifted package scripts", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const packageJsonPath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts["ai:check"] = "custom";
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  const result = runCli(["doctor", "--target", target, "--ci", "none"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /drift/);
  assert.match(result.stdout, /package\.json/);
});

test("doctor json output is parseable", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.writeFileSync(path.join(target, "scripts", "ai-check-fast.sh"), "changed\n");
  const result = runCli(["doctor", "--target", target, "--ci", "none", "--json"]);

  // FR-06: baseline から改変されたファイルは modified-local warning（非 strict は pass）
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.strict, false);
  assert.equal(Array.isArray(output.warnings), true);
  assert.equal(output.warnings.some(
    (warning) => warning.code === "modified-local" && warning.path === "scripts/ai-check-fast.sh",
  ), true);
  // OPS-02: 出力に install state の schemaVersion を含める
  assert.equal(output.schemaVersion, 2);
});

test("strict mode keeps modified-local warnings as failures", (t) => {
  // FR-06: strict では modified-local warning も失敗として扱われる
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.writeFileSync(path.join(target, "scripts", "ai-check-fast.sh"), "changed\n");
  const result = runCli(["doctor", "--target", target, "--ci", "none", "--strict", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.strict, true);
  assert.equal(output.warnings.some((warning) => warning.code === "modified-local"), true);
});

test("doctor skips profile warnings for malformed package json", (t) => {
  const target = createFixture(t);
  fs.writeFileSync(path.join(target, "package.json"), "{bad json\n");
  const result = runCli(["doctor", "--target", target, "--ci", "none", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.issues[0].code, "invalid-json");
  assert.deepEqual(output.warnings, []);
});

test("doctor rejects target without package.json", (t) => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-empty-"));
  t.after(() => {
    fs.rmSync(target, { recursive: true, force: true });
  });
  const result = runCli(["doctor", "--target", target, "--ci", "none"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /missing-file/);
  assert.match(result.stdout, /package\.json/);
});

test("doctor は ok / drift-upstream / modified-local を区別して報告する", (t) => {
  // FR-06: managed ファイルごとに ok（一致）/ drift-upstream（更新未適用）/
  // modified-local（ユーザー改変）を区別して報告する
  const target = createFixture(t);
  initFixture(target, ["--package-manager", "npm", "--ci", "direct"]);
  // ユーザー改変（local != baseline）→ modified-local
  fs.writeFileSync(path.join(target, "scripts", "ai-check-fast.sh"), "changed\n");

  // upstream 変化のシミュレーション: workflow は npm baseline のまま
  // pnpm 期待でチェック → local == baseline != upstream → drift-upstream
  const result = runCli(["doctor", "--target", target, "--ci", "direct", "--package-manager", "pnpm", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  const statusOf = (filePath) => output.managedFiles.find((file) => file.path === filePath)?.status;
  assert.equal(statusOf("scripts/ai-check.sh"), "ok");
  assert.equal(statusOf(".github/workflows/ai-check.yml"), "drift-upstream");
  assert.equal(statusOf("scripts/ai-check-fast.sh"), "modified-local");
  // drift-upstream は issue、modified-local は warning
  assert.equal(output.issues.some(
    (issue) => issue.code === "drift-upstream" && issue.path === ".github/workflows/ai-check.yml",
  ), true);
  assert.equal(output.warnings.some(
    (warning) => warning.code === "modified-local" && warning.path === "scripts/ai-check-fast.sh",
  ), true);
  // OPS-02: schemaVersion を出力に含める
  assert.equal(output.schemaVersion, 2);
});

test("doctor human 出力に schema-version と managed ファイル状態を含める", (t) => {
  // OPS-02: v1 state 残存（migration 未完了）を観測可能にするため
  // schemaVersion を出力する
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);

  const result = runCli(["doctor", "--target", target, "--ci", "none"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /schema-version: 2/);
  assert.match(result.stdout, /- ok: scripts\/ai-check\.sh/);
});

test("doctor は v1 state の schemaVersion を 1 として報告する", (t) => {
  // OPS-02: migration 未完了（v1 残存）が観測できる
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const statePath = path.join(target, ".ai-check-template.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  delete state.managedFiles;
  fs.writeFileSync(statePath, `${JSON.stringify({ ...state, schemaVersion: 1 }, null, 2)}\n`);

  const result = runCli(["doctor", "--target", target, "--ci", "none", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).schemaVersion, 1);
});

// 異常系3: install state の JSON 破損 → doctor は invalid-install-state を報告する
test("doctor reports malformed install state without writing", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.writeFileSync(path.join(target, ".ai-check-template.json"), "{bad json\n");
  const before = snapshotDirectory(target);
  const result = runCli(["doctor", "--target", target, "--ci", "none"]);
  const after = snapshotDirectory(target);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /invalid-install-state/);
  assert.deepEqual(after, before);
});

// --- SPEC-0057: local overlay（doctor 不干渉） ---

// overlay ファイル（scripts/ai-check.local.sh と .claude/rules/local/ 配下）を配置する
function placeOverlayFiles(target) {
  fs.writeFileSync(path.join(target, "scripts", "ai-check.local.sh"), "export PM=npm\necho \"overlay\"\n");
  const localRulePath = path.join(target, ".claude", "rules", "local", "my-rule.md");
  fs.mkdirSync(path.dirname(localRulePath), { recursive: true });
  fs.writeFileSync(localRulePath, "# my project rule\n");
}

test("doctor は overlay ファイルの有無で結果が変わらない", (t) => {
  // AC-04 / FR-05: ai-check.local.sh と .claude/rules/local/ 配下は drift 検査対象外。
  // overlay 配置前後の doctor --json 出力（status / issues / warnings / managedFiles）が
  // 同一で、exit code も変わらない
  const target = createFixture(t);
  initFixture(target, ["--ci", "none", "--claude-hooks"]);

  const withoutLocal = runCli(["doctor", "--target", target, "--ci", "none", "--claude-hooks", "--json"]);
  assert.equal(withoutLocal.status, 0, withoutLocal.stderr);

  placeOverlayFiles(target);
  const withLocal = runCli(["doctor", "--target", target, "--ci", "none", "--claude-hooks", "--json"]);

  assert.equal(withLocal.status, 0, withLocal.stderr);
  // AC-04: 結果が local ファイル無しの場合と同一
  assert.deepEqual(JSON.parse(withLocal.stdout), JSON.parse(withoutLocal.stdout));
  // FR-05: 出力に local パスが drift 対象として現れない
  assert.doesNotMatch(withLocal.stdout, /ai-check\.local\.sh/);
  assert.doesNotMatch(withLocal.stdout, /rules\/local/);
});

test("strict doctor も overlay ファイルの有無で結果が変わらない", (t) => {
  // AC-04 / FR-05: --strict でも local 起因の warning / issue が出ない
  const target = createFixture(t);
  initFixture(target, ["--ci", "none", "--claude-hooks"]);
  mergePackageScripts(target, {
    typecheck: "tsc --noEmit",
    lint: "eslint .",
    test: "vitest run",
    "test:unit": "vitest run --dir tests/unit",
    "test:e2e:smoke": "playwright test --grep smoke",
    doctor: "npx -y react-doctor@latest . --fail-on warning",
    deadcode: "knip",
  });

  const withoutLocal = runCli(["doctor", "--target", target, "--ci", "none", "--claude-hooks", "--strict", "--json"]);
  assert.equal(withoutLocal.status, 0, withoutLocal.stderr);

  placeOverlayFiles(target);
  const withLocal = runCli(["doctor", "--target", target, "--ci", "none", "--claude-hooks", "--strict", "--json"]);

  assert.equal(withLocal.status, 0, withLocal.stderr);
  assert.deepEqual(JSON.parse(withLocal.stdout), JSON.parse(withoutLocal.stdout));
});
