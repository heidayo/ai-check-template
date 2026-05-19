import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const binPath = path.join(repoRoot, "bin", "ai-check-template.mjs");

function runCli(args) {
  return spawnSync(process.execPath, [binPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function createFixture(t, scripts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-run-"));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify({ name: "fixture", scripts }, null, 2)}\n`);
  return dir;
}

test("run emits structured pass output", (t) => {
  const target = createFixture(t, {
    "ai:check": "node -e \"console.log('one')\" && node -e \"console.log('two')\"",
  });

  const result = runCli(["run", "--target", target, "--script", "ai:check", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "PASS");
  assert.equal(output.steps.length, 2);
  assert.equal(output.steps[0].status, "PASS");
  assert.equal(output.steps[1].status, "PASS");
  assert.match(output.steps[0].stdout, /one/);
});

test("run marks remaining steps skipped after failure", (t) => {
  const target = createFixture(t, {
    "ai:check": "node -e \"console.log('ok')\" && node -e \"process.exit(7)\" && node -e \"console.log('never')\"",
  });

  const result = runCli(["run", "--target", target, "--script", "ai:check", "--json"]);

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "FAIL");
  assert.equal(output.steps[0].status, "PASS");
  assert.equal(output.steps[1].status, "FAIL");
  assert.equal(output.steps[1].exitCode, 7);
  assert.equal(output.steps[2].status, "SKIPPED");
  assert.equal(output.steps[2].exitCode, null);
});

test("run redacts secret-like output and writes output file", (t) => {
  const outputPath = path.join(os.tmpdir(), `ai-check-template-run-${Date.now()}.json`);
  t.after(() => {
    fs.rmSync(outputPath, { force: true });
  });
  const target = createFixture(t, {
    "ai:check": "node -e \"console.log('API_TOKEN=supersecretvalue')\"",
  });

  const result = runCli([
    "run",
    "--target",
    target,
    "--script",
    "ai:check",
    "--json",
    "--output",
    outputPath,
  ]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.match(output.steps[0].stdout, /API_TOKEN=\[REDACTED\]/);
  assert.equal(fs.existsSync(outputPath), true);
  assert.deepEqual(JSON.parse(fs.readFileSync(outputPath, "utf8")), output);
});

test("run rejects missing package script", (t) => {
  const target = createFixture(t, {});
  const result = runCli(["run", "--target", target, "--script", "ai:check", "--json"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing package script: ai:check/);
});
