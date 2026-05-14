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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-update-"));
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

function doctor(target, args = []) {
  return runCli(["doctor", "--target", target, ...args]);
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

test("prints update help", () => {
  const result = runCli(["update", "--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ai-check-template update/);
  assert.match(result.stdout, /--dry-run/);
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
    "--yes",
  ]);
  assert.equal(init.status, 0, init.stderr);
  fs.writeFileSync(path.join(target, ".github", "workflows", "ai-quality-call.yml"), "changed\n");

  const update = runCli(["update", "--target", target, "--yes"]);

  assert.equal(update.status, 0, update.stderr);
  assert.equal(doctor(target).status, 0);
  const state = readInstallState(target);
  assert.equal(state.profile.base, "react-nextjs");
  assert.deepEqual(state.profile.addons, ["supabase-rls"]);
  assert.equal(state.ci, "reusable");
  assert.equal(state.claudeHooks, true);
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
  assert.equal(output.effectiveOptions.ci, "none");
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
    "--yes",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const state = readInstallState(target);
  assert.equal(state.profile.base, "node-cli");
  assert.deepEqual(state.profile.addons, []);
  assert.equal(state.ci, "reusable");
  assert.equal(state.claudeHooks, true);
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
