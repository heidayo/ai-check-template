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

// --- SPEC-0059: `step` フィールドの許容（AC-08 / FR-08） ---
// 期待値は SPEC-0059 の AC-08 から導出する（AP-07 対策）。

test("expect は step フィールド付き AC を従来どおり pass させる", (t) => {
  // AC-08 / FR-08: step（任意・非空文字列）の additive 追加は妥当性を変えない
  const filePath = tempFile(t, ".json", JSON.stringify({
    requirement: { id: "REQ-001", summary: "demo" },
    acceptanceCriteria: [
      { id: "AC-01", criterion: "with step", command: "pnpm ai:check", step: "unit" },
    ],
    testMatrix: [
      {
        id: "T-001",
        ac: "AC-01",
        scenario: "s",
        given: "g",
        when: "w",
        then: "t",
        command: "pnpm ai:check",
      },
    ],
  }, null, 2));

  const result = runCli(["expect", "--file", filePath, "--json"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, "pass");
});

test("expect は step が空文字列のとき invalid-step issue で fail する", (t) => {
  // AC-08 / FR-08: step の値が非空文字列でない場合のみ issue になる
  const filePath = tempFile(t, ".json", JSON.stringify({
    requirement: { id: "REQ-001", summary: "demo" },
    acceptanceCriteria: [
      { id: "AC-01", criterion: "empty step", command: "pnpm ai:check", step: "" },
    ],
    testMatrix: [
      {
        id: "T-001",
        ac: "AC-01",
        scenario: "s",
        given: "g",
        when: "w",
        then: "t",
        command: "pnpm ai:check",
      },
    ],
  }, null, 2));

  const result = runCli(["expect", "--file", filePath, "--json"]);

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.issues.some((issue) => issue.code === "invalid-step"), true);
});

test("validateExpectation（export）は step 有り/無し/非文字列を直接判定できる", async () => {
  // AC-08 / FR-02: report から再利用される export 関数の直接検証
  const { validateExpectation } = await import(path.join(repoRoot, "src", "cli", "expect.mjs"));
  const base = {
    requirement: { id: "REQ-001", summary: "demo" },
    acceptanceCriteria: [{ id: "AC-01", criterion: "c", command: "pnpm test" }],
    testMatrix: [
      { id: "T-001", ac: "AC-01", scenario: "s", given: "g", when: "w", then: "t", command: "pnpm test" },
    ],
  };

  // step 無し（後方互換）: issue 0 件
  assert.deepEqual(validateExpectation(base), []);

  // step 有り（非空文字列）: issue 0 件
  const withStep = structuredClone(base);
  withStep.acceptanceCriteria[0].step = "unit";
  assert.deepEqual(validateExpectation(withStep), []);

  // step が空白のみ・非文字列: invalid-step
  for (const badStep of ["   ", 42]) {
    const invalid = structuredClone(base);
    invalid.acceptanceCriteria[0].step = badStep;
    const issues = validateExpectation(invalid);
    assert.equal(issues.some((issue) => issue.code === "invalid-step"), true, JSON.stringify(badStep));
  }
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
