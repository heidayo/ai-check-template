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

function tempFile(t, extension, value) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-expect-"));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const filePath = path.join(dir, `matrix${extension}`);
  fs.writeFileSync(filePath, value);
  return filePath;
}

test("expect validates packaged JSON example", () => {
  const result = runCli([
    "expect",
    "--file",
    path.join(repoRoot, "package-templates", "docs", "ac-test-matrix.example.json"),
    "--json",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.summary.acceptanceCriteria, 3);
});

test("expect validates packaged YAML example", () => {
  const result = runCli([
    "expect",
    "--file",
    path.join(repoRoot, "package-templates", "docs", "ac-test-matrix.example.yaml"),
    "--json",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.summary.testMatrix, 3);
});

test("expect fails when an AC is not covered", (t) => {
  const filePath = tempFile(t, ".json", JSON.stringify({
    requirement: { id: "REQ-001", summary: "demo" },
    acceptanceCriteria: [
      { id: "AC-01", criterion: "covered", command: "pnpm test" },
      { id: "AC-02", criterion: "uncovered", command: "pnpm test" },
    ],
    testMatrix: [
      {
        id: "T-001",
        ac: "AC-01",
        scenario: "covered",
        given: "state",
        when: "action",
        then: "result",
        command: "pnpm test",
      },
    ],
  }, null, 2));

  const result = runCli(["expect", "--file", filePath, "--json"]);

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.issues.some((issue) => issue.code === "uncovered-ac"), true);
});

test("expect rejects unknown AC references", (t) => {
  const filePath = tempFile(t, ".yaml", `requirement:
  id: REQ-001
  summary: demo
acceptanceCriteria:
  - id: AC-01
    criterion: covered
    command: pnpm test
testMatrix:
  - id: T-001
    ac: AC-99
    scenario: missing reference
    given: state
    when: action
    then: result
    command: pnpm test
`);

  const result = runCli(["expect", "--file", filePath, "--json"]);

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout);
  assert.equal(output.issues.some((issue) => issue.code === "unknown-ac-reference"), true);
});
