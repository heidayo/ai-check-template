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
    "--yes",
  ]);
  assert.equal(init.status, 0, init.stderr);

  const result = runCli(["doctor", "--target", target, "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.installation.source, "state");
  assert.equal(output.effectiveOptions.profile, "react-nextjs+supabase-rls");
  assert.equal(output.effectiveOptions.ci, "reusable");
  assert.equal(output.effectiveOptions.claudeHooks, true);
  assert.equal(Array.isArray(output.warnings), true);
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
  assert.equal(output.issues.length, 0);
  assert.equal(output.warnings.some((warning) => warning.code === "profile-advice"), true);
  assert.doesNotMatch(result.stdout, /pnpm typecheck/);
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

test("doctor returns non-zero for missing files", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.rmSync(path.join(target, "scripts", "ai-check.sh"));
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

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(Array.isArray(output.warnings), true);
  assert.equal(output.issues[0].code, "drift");
  assert.equal(output.issues[0].path, "scripts/ai-check-fast.sh");
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
