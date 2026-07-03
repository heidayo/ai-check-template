import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// SPEC-0059: `report` — AC 宣言と run 実測の機械照合。
// 期待値は SPEC-0059 の AC-02〜AC-06 / FR-01〜FR-07 / SEC-02 / INV から導出（AP-07 対策）。

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const binPath = path.join(repoRoot, "bin", "ai-check-template.mjs");

const { matchCriterion, checkRunResult, buildReport, formatMarkdown } = await import(
  path.join(repoRoot, "src", "cli", "report.mjs")
);
const { CliError } = await import(path.join(repoRoot, "src", "cli", "utils.mjs"));

function runCli(args) {
  return spawnSync(process.execPath, [binPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-report-"));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

// expect 側 fixture: validateExpectation を通る完全形（全 AC を testMatrix で cover）
function makeExpectValue(acceptanceCriteria) {
  return {
    requirement: { id: "REQ-001", summary: "demo requirement" },
    acceptanceCriteria,
    testMatrix: acceptanceCriteria.map((criterion, index) => ({
      id: `T-00${index + 1}`,
      ac: criterion.id,
      scenario: `scenario ${criterion.id}`,
      given: "state",
      when: "action",
      then: "result",
      command: criterion.command,
    })),
  };
}

function makeStep(overrides = {}) {
  return {
    index: 1,
    name: "step-1",
    source: "default",
    command: "npm test",
    status: "PASS",
    exitCode: 0,
    durationMs: 10,
    stdout: "",
    stderr: "",
    ...overrides,
  };
}

function makeRunResult(steps) {
  return {
    status: steps.some((step) => step.status === "FAIL") ? "FAIL" : "PASS",
    script: "ai:check",
    command: steps.map((step) => step.command).join(" && "),
    startedAt: "2026-07-03T00:00:00.000Z",
    durationMs: 100,
    configPath: null,
    steps,
  };
}

function writeExpectFile(dir, value) {
  const filePath = path.join(dir, "matrix.json");
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  return filePath;
}

function writeRunFile(dir, value) {
  const filePath = path.join(dir, "run-result.json");
  fs.writeFileSync(filePath, typeof value === "string" ? value : JSON.stringify(value, null, 2));
  return filePath;
}

// --- unit: matchCriterion（AC-03 / FR-04: 明示キーのみ・4 分岐） ---

test("matchCriterion: step 名の完全一致で matched-step になる", () => {
  // AC-02 / FR-04(a): AC の step が run step name と完全一致すれば対応付く
  const steps = [makeStep({ name: "lint" }), makeStep({ index: 2, name: "unit" })];
  const result = matchCriterion({ id: "AC-01", criterion: "c", command: "other", step: "unit" }, steps);

  assert.equal(result.reason, "matched-step");
  assert.equal(result.step.name, "unit");
});

test("matchCriterion: step 省略時に同一 command が 1 件なら matched-command になる", () => {
  // AC-03 / FR-04(b): trim 後完全一致がちょうど 1 件の場合のみ対応付く
  const steps = [makeStep({ name: "lint", command: "npm run lint" }), makeStep({ index: 2, name: "unit", command: "npm test" })];
  const result = matchCriterion({ id: "AC-01", criterion: "c", command: "  npm test  " }, steps);

  assert.equal(result.reason, "matched-command");
  assert.equal(result.step.name, "unit");
});

test("matchCriterion: 存在しない step 名・一致 command 0 件は no-match になる", () => {
  // AC-02 / 想定エラー4: step の typo はエラーではなく no-match（UNVERIFIED 経由で --strict が捕捉）
  const steps = [makeStep({ name: "lint", command: "npm run lint" })];

  const byStep = matchCriterion({ id: "AC-01", criterion: "c", command: "x", step: "no-such-step" }, steps);
  assert.equal(byStep.reason, "no-match");
  assert.equal(byStep.step, null);

  const byCommand = matchCriterion({ id: "AC-02", criterion: "c", command: "npm test" }, steps);
  assert.equal(byCommand.reason, "no-match");
  assert.equal(byCommand.step, null);
});

test("matchCriterion: 同一 command の step が 2 件以上なら ambiguous-command で対応なしになる", () => {
  // AC-03 / Forbidden Shortcuts: 曖昧照合しない — 2 件一致は対応付けず UNVERIFIED
  const steps = [
    makeStep({ name: "unit-a", command: "npm test" }),
    makeStep({ index: 2, name: "unit-b", command: "npm test" }),
  ];
  const result = matchCriterion({ id: "AC-01", criterion: "c", command: "npm test" }, steps);

  assert.equal(result.reason, "ambiguous-command");
  assert.equal(result.step, null);
});

// --- unit: checkRunResult（AC-06c / AC-06d / FR-03） ---

test("checkRunResult: 正常な run 結果はエラーにならない", () => {
  // FR-03: run --json の生成物相当は構造チェックを通過する
  assert.doesNotThrow(() => checkRunResult(makeRunResult([makeStep()]), "run.json"));
});

test("checkRunResult: step の必須フィールド欠落はフィールド名入り CliError になる", () => {
  // AC-06(c) / FR-03: steps[].name 欠落を violated field 名付きで報告する
  const step = makeStep();
  delete step.name;

  assert.throws(
    () => checkRunResult(makeRunResult([step]), "run.json"),
    (error) => error instanceof CliError && /steps\[0\]\.name/.test(error.message) && /run\.json/.test(error.message),
  );
});

test("checkRunResult: ルート必須フィールド欠落と型不一致もフィールド名入り CliError になる", () => {
  // AC-06(c) / FR-03 / OPS-02: 違反フィールド名 + 再生成ヒントを 1 メッセージに含める
  const runResult = makeRunResult([makeStep()]);
  delete runResult.configPath;
  runResult.durationMs = "fast";

  assert.throws(
    () => checkRunResult(runResult, "run.json"),
    (error) =>
      error instanceof CliError &&
      /configPath/.test(error.message) &&
      /durationMs/.test(error.message) &&
      /ai-check-template run --output/.test(error.message),
  );
});

test("checkRunResult: step name 重複は重複名を挙げた CliError になる", () => {
  // AC-06(d) / 想定エラー3: 照合キー一意性違反は fail-fast
  const runResult = makeRunResult([
    makeStep({ name: "unit" }),
    makeStep({ index: 2, name: "unit" }),
  ]);

  assert.throws(
    () => checkRunResult(runResult, "run.json"),
    (error) => error instanceof CliError && /duplicate step name/.test(error.message) && /unit/.test(error.message),
  );
});

// --- unit: buildReport（FR-05 / INV-03 / 契約(1)） ---

test("buildReport: PASS/FAIL/UNVERIFIED の 3 値判定と summary が期待どおりになる", () => {
  // FR-05: 対応 step PASS → PASS、FAIL → FAIL、SKIPPED・対応なし → UNVERIFIED
  const expectValue = makeExpectValue([
    { id: "AC-01", criterion: "passes", command: "cmd-pass" },
    { id: "AC-02", criterion: "fails", command: "cmd-fail" },
    { id: "AC-03", criterion: "skipped", command: "cmd-skip" },
    { id: "AC-04", criterion: "unmatched", command: "cmd-none" },
  ]);
  const runResult = makeRunResult([
    makeStep({ name: "s1", command: "cmd-pass", status: "PASS" }),
    makeStep({ index: 2, name: "s2", command: "cmd-fail", status: "FAIL", exitCode: 1 }),
    makeStep({ index: 3, name: "s3", command: "cmd-skip", status: "SKIPPED", exitCode: null }),
  ]);

  const report = buildReport({ expectValue, runResult, expectFile: "e.json", runFile: "r.json" });

  assert.deepEqual(report.criteria.map((entry) => entry.verdict), ["PASS", "FAIL", "UNVERIFIED", "UNVERIFIED"]);
  assert.deepEqual(report.criteria.map((entry) => entry.reason), [
    "matched-command",
    "matched-command",
    "matched-command",
    "no-match",
  ]);
  // 契約(1): summary は total/passed/failed/unverified
  assert.deepEqual(report.summary, { total: 4, passed: 1, failed: 1, unverified: 2 });
  // INV-03: passed + failed + unverified == total
  assert.equal(report.summary.passed + report.summary.failed + report.summary.unverified, report.summary.total);
  assert.equal(report.status, "fail");
});

test("buildReport: 全 AC PASS のとき status は pass になる", () => {
  // FR-05 / POST-01 の前提: FAIL/UNVERIFIED 0 件 ⇔ status pass
  const expectValue = makeExpectValue([{ id: "AC-01", criterion: "ok", command: "cmd", step: "s1" }]);
  const runResult = makeRunResult([makeStep({ name: "s1", command: "cmd" })]);

  const report = buildReport({ expectValue, runResult, expectFile: "e.json", runFile: "r.json" });

  assert.equal(report.status, "pass");
  assert.equal(report.criteria[0].reason, "matched-step");
  assert.deepEqual(report.summary, { total: 1, passed: 1, failed: 0, unverified: 0 });
});

// --- integration: CLI 経由の 3 形式出力・--strict・異常系 ---

function mixedFixture(t) {
  // AC-02 の入力: step 明示 AC + PASS/FAIL/SKIPPED 混在 run + 4 種の reason を網羅
  const dir = tempDir(t);
  const expectFile = writeExpectFile(dir, makeExpectValue([
    { id: "AC-01", criterion: "explicit step passes", command: "other", step: "lint" },
    { id: "AC-02", criterion: "command match fails", command: "npm run unit" },
    { id: "AC-03", criterion: "skipped step", command: "irrelevant", step: "e2e" },
    { id: "AC-04", criterion: "no matching step", command: "npm run nothing" },
    { id: "AC-05", criterion: "ambiguous command", command: "npm run dup" },
  ]));
  const runFile = writeRunFile(dir, makeRunResult([
    makeStep({ name: "lint", command: "npm run lint", status: "PASS", stdout: "SECRET_STDOUT_MARKER" }),
    makeStep({ index: 2, name: "unit", command: "npm run unit", status: "FAIL", exitCode: 1, stderr: "SECRET_STDERR_MARKER" }),
    makeStep({ index: 3, name: "e2e", command: "npm run e2e", status: "SKIPPED", exitCode: null }),
    makeStep({ index: 4, name: "dup-a", command: "npm run dup", status: "PASS" }),
    makeStep({ index: 5, name: "dup-b", command: "npm run dup", status: "PASS" }),
  ]));
  return { expectFile, runFile };
}

test("report --format json は各 AC の判定・対応 step・判定理由・サマリを出力する", (t) => {
  // AC-02 / FR-05 / OPS-01: 4 種の reason（matched-step/matched-command/no-match/ambiguous-command）
  // と PASS/FAIL/UNVERIFIED が機械判読できる
  const { expectFile, runFile } = mixedFixture(t);

  const result = runCli(["report", "--expect", expectFile, "--run", runFile, "--format", "json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.expectFile, expectFile);
  assert.equal(output.runFile, runFile);
  assert.deepEqual(output.summary, { total: 5, passed: 1, failed: 1, unverified: 3 });
  assert.deepEqual(
    output.criteria.map((entry) => [entry.id, entry.verdict, entry.reason, entry.step]),
    [
      ["AC-01", "PASS", "matched-step", "lint"],
      ["AC-02", "FAIL", "matched-command", "unit"],
      ["AC-03", "UNVERIFIED", "matched-step", "e2e"],
      ["AC-04", "UNVERIFIED", "no-match", null],
      ["AC-05", "UNVERIFIED", "ambiguous-command", null],
    ],
  );
});

test("report --json は --format json の別名として同一出力になる", (t) => {
  // FR-01: --json alias
  const { expectFile, runFile } = mixedFixture(t);

  const byFlag = runCli(["report", "--expect", expectFile, "--run", runFile, "--json"]);
  const byFormat = runCli(["report", "--expect", expectFile, "--run", runFile, "--format", "json"]);

  assert.equal(byFlag.status, 0, byFlag.stderr);
  assert.equal(byFlag.stdout, byFormat.stdout);
});

test("report --format markdown は GFM 表 + サマリ行を出力し stdout/stderr 断片を含まない", (t) => {
  // AC-04 / FR-06 / POST-02 / SEC-02 / INV-05
  const { expectFile, runFile } = mixedFixture(t);

  const result = runCli(["report", "--expect", expectFile, "--run", runFile, "--format", "markdown"]);

  assert.equal(result.status, 0, result.stderr);
  const lines = result.stdout.trimEnd().split("\n");
  // POST-02: AC 総数 5 + ヘッダ 2 行 + サマリ行
  assert.equal(lines.length, 5 + 2 + 1);
  assert.equal(lines[0], "| AC | 宣言内容 | 対応 step / コマンド | 判定 |");
  assert.match(lines[1], /^\|-+\|-+\|-+\|-+\|$/);
  assert.match(lines[2], /\| AC-01 \| .* \| lint \| PASS \|/);
  // FR-06: 検証済み N / 宣言 M のサマリ行（検証済み = PASS + FAIL）
  assert.equal(lines[lines.length - 1], "検証済み 2 / 宣言 5");
  // SEC-02: step の stdout/stderr は出力に含めない
  assert.doesNotMatch(result.stdout, /SECRET_STDOUT_MARKER/);
  assert.doesNotMatch(result.stdout, /SECRET_STDERR_MARKER/);
});

test("report --format markdown はセル内の `|` をエスケープして表構造を保つ", (t) => {
  // AC-04 / FR-06: criterion / command に `|` を含むケースで表が壊れない
  const dir = tempDir(t);
  const expectFile = writeExpectFile(dir, makeExpectValue([
    { id: "AC-01", criterion: "pipes a | b are handled", command: "grep foo | wc -l" },
  ]));
  const runFile = writeRunFile(dir, makeRunResult([
    makeStep({ name: "count", command: "grep foo | wc -l" }),
  ]));

  const result = runCli(["report", "--expect", expectFile, "--run", runFile, "--format", "markdown"]);

  assert.equal(result.status, 0, result.stderr);
  const row = result.stdout.split("\n")[2];
  assert.match(row, /pipes a \\\| b are handled/);
  // エスケープされない `|` はセル区切りの 5 個だけ（4 列表）
  assert.equal(row.replace(/\\\|/g, "").split("|").length - 1, 5);
});

test("report の既定 format は text で判定と summary を出力する", (t) => {
  // FR-01（--format 既定 text）/ FR-05（サマリ 4 件数）/ SEC-02
  const { expectFile, runFile } = mixedFixture(t);

  const result = runCli(["report", "--expect", expectFile, "--run", runFile]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ai-check-template report fail/);
  assert.match(result.stdout, /AC-01 PASS \(matched-step\) lint/);
  assert.match(result.stdout, /AC-05 UNVERIFIED \(ambiguous-command\)/);
  assert.match(result.stdout, /summary: total 5, passed 1, failed 1, unverified 3/);
  assert.doesNotMatch(result.stdout, /SECRET_STDOUT_MARKER/);
});

test("report --strict は FAIL/UNVERIFIED が 1 件以上ならレポート出力後に exit 1 になる", (t) => {
  // AC-05 / FR-07: strict はレポートを出した上で非 0 終了する
  const { expectFile, runFile } = mixedFixture(t);

  const result = runCli(["report", "--expect", expectFile, "--run", runFile, "--json", "--strict"]);

  assert.equal(result.status, 1);
  // レポート本体は出力済み（strict は出力後の判定）
  const output = JSON.parse(result.stdout);
  assert.equal(output.summary.failed + output.summary.unverified > 0, true);
  assert.match(result.stderr, /strict/);
});

test("report --strict は全 AC PASS なら exit 0、--strict 無しは FAIL 混在でも exit 0 になる", (t) => {
  // AC-05 / FR-07 / POST-01: exit code は「FAIL/UNVERIFIED 0 件」と同値
  const dir = tempDir(t);
  const expectFile = writeExpectFile(dir, makeExpectValue([
    { id: "AC-01", criterion: "all pass", command: "npm test", step: "unit" },
  ]));
  const runFile = writeRunFile(dir, makeRunResult([
    makeStep({ name: "unit", command: "npm test", status: "PASS" }),
  ]));

  const strictPass = runCli(["report", "--expect", expectFile, "--run", runFile, "--strict"]);
  assert.equal(strictPass.status, 0, strictPass.stderr);

  const { expectFile: mixedExpect, runFile: mixedRun } = mixedFixture(t);
  const lenient = runCli(["report", "--expect", mixedExpect, "--run", mixedRun]);
  assert.equal(lenient.status, 0, lenient.stderr);
});

test("report --strict は照合 0 件（全 AC UNVERIFIED）でも exit 1 になる", (t) => {
  // 境界ケース1: 検証ゼロの「完了しました」自己申告を CI が機械的に弾く中核ケース
  const dir = tempDir(t);
  const expectFile = writeExpectFile(dir, makeExpectValue([
    { id: "AC-01", criterion: "never verified", command: "npm run nothing" },
  ]));
  const runFile = writeRunFile(dir, makeRunResult([
    makeStep({ name: "unit", command: "npm test" }),
  ]));

  const result = runCli(["report", "--expect", expectFile, "--run", runFile, "--strict"]);

  assert.equal(result.status, 1);
});

test("report は --expect / --run 欠落・未知 format を usage 付き CliError で拒否する", (t) => {
  // FR-01: 必須オプションと --format の許容値
  const { expectFile, runFile } = mixedFixture(t);

  const missingExpect = runCli(["report", "--run", runFile]);
  assert.equal(missingExpect.status, 1);
  assert.match(missingExpect.stderr, /Missing --expect/);
  assert.match(missingExpect.stderr, /Usage:/);

  const missingRun = runCli(["report", "--expect", expectFile]);
  assert.equal(missingRun.status, 1);
  assert.match(missingRun.stderr, /Missing --run/);

  const badFormat = runCli(["report", "--expect", expectFile, "--run", runFile, "--format", "html"]);
  assert.equal(badFormat.status, 1);
  assert.match(badFormat.stderr, /Unknown report format: html/);
});

test("report は expect ファイルの validation fail で照合結果を出力せず非 0 終了する", (t) => {
  // AC-06(a) / FR-02 / INV-04: issue 一覧付き CliError・部分レポート禁止
  const dir = tempDir(t);
  const expectFile = writeExpectFile(dir, {
    requirement: { id: "REQ-001", summary: "demo" },
    testMatrix: [],
  });
  const runFile = writeRunFile(dir, makeRunResult([makeStep()]));

  const result = runCli(["report", "--expect", expectFile, "--run", runFile, "--json"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing-acceptance-criteria/);
  assert.match(result.stderr, new RegExp(expectFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(result.stdout, "");
});

test("report は run JSON パース不能時に照合結果を出力せず非 0 終了する", (t) => {
  // AC-06(b) / FR-03 / OPS-02: 対象ファイル名 + 再生成ヒント入り CliError
  const dir = tempDir(t);
  const expectFile = writeExpectFile(dir, makeExpectValue([
    { id: "AC-01", criterion: "c", command: "npm test" },
  ]));
  const runFile = writeRunFile(dir, "{ not valid json ");

  const result = runCli(["report", "--expect", expectFile, "--run", runFile, "--json"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid run result JSON/);
  assert.match(result.stderr, /ai-check-template run --output/);
  assert.equal(result.stdout, "");
});

test("report は run JSON の必須フィールド欠落時に照合結果を出力せず非 0 終了する", (t) => {
  // AC-06(c) / FR-03 / INV-04: steps[].name 欠落をフィールド名入りで報告し fail-fast
  const dir = tempDir(t);
  const expectFile = writeExpectFile(dir, makeExpectValue([
    { id: "AC-01", criterion: "c", command: "npm test" },
  ]));
  const step = makeStep();
  delete step.name;
  const runFile = writeRunFile(dir, makeRunResult([step]));

  const result = runCli(["report", "--expect", expectFile, "--run", runFile, "--json"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /steps\[0\]\.name/);
  assert.equal(result.stdout, "");
});

test("report は run JSON の step name 重複時に照合結果を出力せず非 0 終了する", (t) => {
  // AC-06(d) / 想定エラー3: 重複 step 名を挙げた CliError・部分照合禁止
  const dir = tempDir(t);
  const expectFile = writeExpectFile(dir, makeExpectValue([
    { id: "AC-01", criterion: "c", command: "npm test", step: "unit" },
  ]));
  const runFile = writeRunFile(dir, makeRunResult([
    makeStep({ name: "unit" }),
    makeStep({ index: 2, name: "unit" }),
  ]));

  const result = runCli(["report", "--expect", expectFile, "--run", runFile, "--json"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /duplicate step name/);
  assert.match(result.stderr, /unit/);
  assert.equal(result.stdout, "");
});

test("report --format markdown の formatMarkdown 出力は宣言 AC 全件を 1 行ずつ含む", () => {
  // POST-02（unit で行数不変条件を固定）
  const expectValue = makeExpectValue([
    { id: "AC-01", criterion: "a", command: "cmd-a" },
    { id: "AC-02", criterion: "b", command: "cmd-b" },
  ]);
  const runResult = makeRunResult([makeStep({ name: "s1", command: "cmd-a" })]);
  const report = buildReport({ expectValue, runResult, expectFile: "e", runFile: "r" });

  const lines = formatMarkdown(report).split("\n");
  assert.equal(lines.length, 2 + 2 + 1);
});

test("report.mjs はコマンド実行・ファイル書き込みを import しない（読み取り専用）", () => {
  // SEC-01 / Forbidden Shortcuts: child_process / writeFile が無いことの grep 検査
  const source = fs.readFileSync(path.join(repoRoot, "src", "cli", "report.mjs"), "utf8");
  assert.doesNotMatch(source, /child_process/);
  assert.doesNotMatch(source, /writeFile/);
  assert.doesNotMatch(source, /spawn/);
});
