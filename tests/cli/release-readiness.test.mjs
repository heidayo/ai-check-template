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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-release-"));
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify({ name: "fixture", scripts: {} }, null, 2)}\n`);
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

function readPackageJson(target) {
  return JSON.parse(fs.readFileSync(path.join(target, "package.json"), "utf8"));
}

function writePackageJson(target, packageJson) {
  fs.writeFileSync(path.join(target, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
}

test("release readiness lifecycle covers init, doctor, update, and strict doctor", (t) => {
  const target = createFixture(t);

  const init = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "node-cli",
    "--ci",
    "none",
    "--yes",
  ]);
  assert.equal(init.status, 0, init.stderr);

  const firstDoctor = runCli(["doctor", "--target", target, "--json"]);
  assert.equal(firstDoctor.status, 0, firstDoctor.stderr);
  assert.equal(JSON.parse(firstDoctor.stdout).status, "pass");

  const packageJson = readPackageJson(target);
  packageJson.scripts["ai:check"] = "custom";
  writePackageJson(target, packageJson);
  fs.writeFileSync(path.join(target, "scripts", "ai-check.sh"), "changed\n");

  const driftedDoctor = runCli(["doctor", "--target", target, "--json"]);
  assert.notEqual(driftedDoctor.status, 0);
  assert.equal(JSON.parse(driftedDoctor.stdout).status, "fail");

  const update = runCli(["update", "--target", target, "--yes", "--json"]);
  assert.equal(update.status, 0, update.stderr);
  const updateOutput = JSON.parse(update.stdout);
  assert.equal(updateOutput.status, "updated");
  assert.equal(updateOutput.operations.some(
    (operation) => operation.action === "update" && operation.path === "package.json",
  ), true);
  // AC-03 / FR-02 / INV-01: baseline から改変された managed ファイルは
  // デフォルトの update では上書きされず skip-modified になる
  assert.equal(updateOutput.operations.some(
    (operation) => operation.action === "skip-modified" && operation.path === "scripts/ai-check.sh",
  ), true);
  assert.equal(fs.readFileSync(path.join(target, "scripts", "ai-check.sh"), "utf8"), "changed\n");

  // FR-06: 改変ファイルが残る間、strict doctor は modified-local warning で失敗する
  const modifiedStrictDoctor = runCli(["doctor", "--target", target, "--strict", "--json"]);
  assert.notEqual(modifiedStrictDoctor.status, 0);
  assert.equal(JSON.parse(modifiedStrictDoctor.stdout).warnings.some(
    (warning) => warning.code === "modified-local" && warning.path === "scripts/ai-check.sh",
  ), true);

  // AC-04 / FR-03: --force-managed で上書きし .bak-<version> を生成して解消する
  const forced = runCli(["update", "--target", target, "--force-managed", "--yes", "--json"]);
  assert.equal(forced.status, 0, forced.stderr);
  assert.equal(JSON.parse(forced.stdout).operations.some(
    (operation) => operation.action === "overwrite-forced" && operation.path === "scripts/ai-check.sh",
  ), true);
  assert.equal(fs.readFileSync(path.join(target, "scripts", "ai-check.sh.bak-0.4.0"), "utf8"), "changed\n");

  const strictDoctor = runCli(["doctor", "--target", target, "--strict", "--json"]);
  assert.equal(strictDoctor.status, 0, strictDoctor.stderr);
  const strictOutput = JSON.parse(strictDoctor.stdout);
  assert.equal(strictOutput.status, "pass");
  assert.equal(strictOutput.strict, true);
  assert.equal(strictOutput.issues.length, 0);
  assert.equal(strictOutput.warnings.length, 0);
});
