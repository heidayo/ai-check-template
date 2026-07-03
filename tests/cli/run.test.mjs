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

// --- SPEC-0058: `.ai-check.yaml` / `.ai-check.json` config integration ---
// 期待値は SPEC-0058 の AC / FR から導出する（AP-07 対策）。

function writeConfig(target, fileName, content) {
  fs.writeFileSync(path.join(target, fileName), content);
}

test("config 不在時は現行動作のまま configPath: null・全 step source: default になる", (t) => {
  // AC-02 / NFR-01 / INV-02: 設定ファイル不在なら実行コマンド列・exit code・
  // 既存 JSON フィールド値が本 SPEC 適用前と同一（追加は name/source/configPath のみ）
  const target = createFixture(t, {
    "ai:check": "node -e \"console.log('one')\" && node -e \"console.log('two')\"",
  });

  const result = runCli(["run", "--target", target, "--script", "ai:check", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.configPath, null);
  // 既存ルートフィールドの保持 + additive のみ（契約: additive only）
  assert.deepEqual(
    Object.keys(output).sort(),
    ["command", "configPath", "durationMs", "script", "startedAt", "status", "steps"],
  );
  assert.equal(output.status, "PASS");
  assert.equal(output.script, "ai:check");
  assert.equal(output.command, "node -e \"console.log('one')\" && node -e \"console.log('two')\"");
  assert.equal(output.steps.length, 2);
  for (const [position, step] of output.steps.entries()) {
    // 既存 step フィールドの保持 + name/source の追加のみ
    assert.deepEqual(
      Object.keys(step).sort(),
      ["command", "durationMs", "exitCode", "index", "name", "source", "status", "stderr", "stdout"],
    );
    assert.equal(step.source, "default");
    assert.equal(step.name, `step-${position + 1}`);
    assert.equal(step.index, position + 1);
    assert.equal(step.status, "PASS");
  }
});

test("config の full gate 宣言で宣言順置換・SKIPPED・source: config・configPath になる", (t) => {
  // AC-03 / FR-04 / POST-02: 宣言順に有効 step のみ実行、enabled: false は SKIPPED、
  // command 省略 step は package script 名参照、configPath は .ai-check.yaml
  const target = createFixture(t, {
    "ai:check": "node -e \"console.log('default-never-runs')\"",
    "test:unit": "node -e \"console.log('unit-ran')\"",
  });
  writeConfig(target, ".ai-check.yaml", [
    "version: 1",
    "steps:",
    "  lint:",
    "    command: node -e \"console.log('lint-ran')\"",
    "    gates: [full]",
    "  e2e:",
    "    command: node -e \"console.log('never')\"",
    "    enabled: false",
    "    gates: [full]",
    "  test:unit:",
    "    gates: [full, fast]",
    "",
  ].join("\n"));

  const result = runCli(["run", "--target", target, "--script", "ai:check", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "PASS");
  assert.equal(output.configPath, ".ai-check.yaml");
  assert.deepEqual(output.steps.map((step) => step.name), ["lint", "e2e", "test:unit"]);
  assert.deepEqual(output.steps.map((step) => step.source), ["config", "config", "config"]);
  assert.deepEqual(output.steps.map((step) => step.status), ["PASS", "SKIPPED", "PASS"]);
  assert.match(output.steps[0].stdout, /lint-ran/);
  // command 省略 step は package script のコマンド文字列をそのまま採用（FR-04）
  assert.equal(output.steps[2].command, "node -e \"console.log('unit-ran')\"");
  assert.match(output.steps[2].stdout, /unit-ran/);
  // 無効 step は実行されない（SKIPPED / exitCode null）
  assert.equal(output.steps[1].exitCode, null);
  assert.equal(output.steps[1].stdout, "");
});

test("command 省略で同名 package script が無い step は CliError で非 0 終了する", (t) => {
  // 想定エラー2 / FR-04: 未知 step 名の実行を黙って skip しない
  const target = createFixture(t, {
    "ai:check": "node -e \"console.log('ok')\"",
  });
  writeConfig(target, ".ai-check.yaml", [
    "version: 1",
    "steps:",
    "  missing-script:",
    "    gates: [full]",
    "",
  ].join("\n"));

  const result = runCli(["run", "--target", target, "--script", "ai:check", "--json"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /step "missing-script" has no command and package script "missing-script" does not exist/);
});

test("config に無い gate は package script にフォールバックし全 step source: default になる", (t) => {
  // AC-06 / FR-05: 設定ファイル自体は存在しても該当 gate の step が無ければ
  // package script の && 分割にフォールバックする
  const target = createFixture(t, {
    "ai:check:fast": "node -e \"console.log('fast-default')\"",
  });
  writeConfig(target, ".ai-check.yaml", [
    "version: 1",
    "steps:",
    "  lint:",
    "    command: node -e \"console.log('full-only')\"",
    "    gates: [full]",
    "",
  ].join("\n"));

  const result = runCli(["run", "--target", target, "--script", "ai:check:fast", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.configPath, null);
  assert.deepEqual(output.steps.map((step) => step.source), ["default"]);
  assert.match(output.steps[0].stdout, /fast-default/);
});

test("--script が 3 ゲート名以外のとき config が存在しても参照されない", (t) => {
  // AC-06 / FR-03: 3 ゲート script 以外では config を参照せず現行どおり実行（configPath: null）
  const target = createFixture(t, {
    custom: "node -e \"console.log('custom-ran')\"",
  });
  writeConfig(target, ".ai-check.yaml", [
    "version: 1",
    "steps:",
    "  lint:",
    "    command: node -e \"console.log('config-never')\"",
    "    gates: [full, fast, secure]",
    "",
  ].join("\n"));

  const result = runCli(["run", "--target", target, "--script", "custom", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.configPath, null);
  assert.deepEqual(output.steps.map((step) => step.source), ["default"]);
  assert.match(output.steps[0].stdout, /custom-ran/);
});

test("config validation エラー時はステップを 1 件も実行せず非 0 終了する", (t) => {
  // AC-05 / FR-07 / INV-03: fail-fast — silent フォールバック（default 実行）は禁止。
  // 実行されたらマーカーファイルが生成されるコマンドで「0 件実行」を検証する
  const target = createFixture(t, {
    "ai:check": "node -e \"require('fs').writeFileSync('default-ran.marker', '1')\"",
  });
  writeConfig(target, ".ai-check.yaml", [
    "version: 1",
    "steps:",
    "  lint:",
    "    command: node -e \"require('fs').writeFileSync('config-ran.marker', '1')\"",
    "    gates: [nightly]",
    "",
  ].join("\n"));

  const result = runCli(["run", "--target", target, "--script", "ai:check", "--json"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\.ai-check\.yaml/);
  assert.match(result.stderr, /unknown gate value "nightly"/);
  assert.equal(fs.existsSync(path.join(target, "default-ran.marker")), false);
  assert.equal(fs.existsSync(path.join(target, "config-ran.marker")), false);
});

test("YAML と JSON の併存時は非 0 終了しステップを実行しない", (t) => {
  // AC-04 / 想定エラー4: 両ファイル名を挙げた CliError で fail-fast
  const target = createFixture(t, {
    "ai:check": "node -e \"require('fs').writeFileSync('default-ran.marker', '1')\"",
  });
  writeConfig(target, ".ai-check.yaml", "version: 1\nsteps:\n  lint:\n    command: node -e \"1\"\n    gates: [full]\n");
  writeConfig(target, ".ai-check.json", JSON.stringify({ version: 1, steps: { lint: { command: "node -e \"1\"", gates: ["full"] } } }));

  const result = runCli(["run", "--target", target, "--script", "ai:check", "--json"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /\.ai-check\.yaml/);
  assert.match(result.stderr, /\.ai-check\.json/);
  assert.equal(fs.existsSync(path.join(target, "default-ran.marker")), false);
});

test(".ai-check.json でも AC-03 と同じ解決結果になる", (t) => {
  // AC-04: YAML/JSON 等価性（integration）— configPath は .ai-check.json になる
  const target = createFixture(t, {
    "ai:check": "node -e \"console.log('default-never-runs')\"",
    "test:unit": "node -e \"console.log('unit-ran')\"",
  });
  writeConfig(target, ".ai-check.json", JSON.stringify({
    version: 1,
    steps: {
      lint: { command: "node -e \"console.log('lint-ran')\"", gates: ["full"] },
      e2e: { command: "node -e \"console.log('never')\"", enabled: false, gates: ["full"] },
      "test:unit": { gates: ["full", "fast"] },
    },
  }, null, 2));

  const result = runCli(["run", "--target", target, "--script", "ai:check", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.configPath, ".ai-check.json");
  assert.deepEqual(output.steps.map((step) => step.name), ["lint", "e2e", "test:unit"]);
  assert.deepEqual(output.steps.map((step) => step.status), ["PASS", "SKIPPED", "PASS"]);
  assert.deepEqual(output.steps.map((step) => step.source), ["config", "config", "config"]);
});

test("config 由来 step の stdout も既存 redaction を通る", (t) => {
  // AC-07 / SEC-02 / INV-04: config 経路で redact() を迂回しない
  const target = createFixture(t, {
    "ai:check": "node -e \"console.log('default')\"",
  });
  writeConfig(target, ".ai-check.yaml", [
    "version: 1",
    "steps:",
    "  leaky:",
    "    command: node -e \"console.log('GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz012345')\"",
    "    gates: [full]",
    "",
  ].join("\n"));

  const result = runCli(["run", "--target", target, "--script", "ai:check", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.steps[0].source, "config");
  assert.match(output.steps[0].stdout, /\[REDACTED\]/);
  assert.doesNotMatch(output.steps[0].stdout, /ghp_abcdefghijklmnopqrstuvwxyz012345/);
});
