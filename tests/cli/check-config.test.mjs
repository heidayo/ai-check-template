import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  CONFIG_JSON_NAME,
  CONFIG_YAML_NAME,
  loadCheckConfig,
  parseConfigYaml,
  resolveGate,
  stepsForGate,
  validateCheckConfig,
} from "../../src/cli/check-config.mjs";

// SPEC-0058 unit tests for `.ai-check.yaml` / `.ai-check.json` detection,
// YAML-subset parsing, and schema v1 validation (AC-04 / AC-05).
// 期待値は SPEC-0058 の AC / FR / 想定エラーから導出する（AP-07 対策）。

function createTempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-config-"));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

function assertCliError(error, pattern) {
  assert.equal(error.name, "CliError", `expected CliError, got ${error.name}: ${error.message}`);
  assert.match(error.message, pattern);
  return true;
}

const YAML_FIXTURE = `version: 1
steps:
  lint:
    command: node -e "console.log('lint')"
    gates: [full, fast]
  e2e:
    command: node -e "console.log('e2e')"
    enabled: false
    gates: [full]
  test:unit:
    gates: [fast]
`;

const JSON_FIXTURE = JSON.stringify(
  {
    version: 1,
    steps: {
      lint: { command: "node -e \"console.log('lint')\"", gates: ["full", "fast"] },
      e2e: { command: "node -e \"console.log('e2e')\"", enabled: false, gates: ["full"] },
      "test:unit": { gates: ["fast"] },
    },
  },
  null,
  2,
);

test("resolveGate は 3 ゲート script のみ gate 名を返し、それ以外は null を返す", () => {
  // FR-03 / AC-06: ai:check=full / ai:check:fast=fast / ai:check:secure=secure、
  // 3 ゲート名以外の --script では config を参照しない
  assert.equal(resolveGate("ai:check"), "full");
  assert.equal(resolveGate("ai:check:fast"), "fast");
  assert.equal(resolveGate("ai:check:secure"), "secure");
  assert.equal(resolveGate("build"), null);
  assert.equal(resolveGate("ai:check:custom"), null);
});

test("loadCheckConfig は設定ファイル不在時に null を返す", async (t) => {
  // FR-01: どちらも存在しない場合は config 不使用（現行動作フォールバックの前提）
  const dir = createTempDir(t);

  assert.equal(await loadCheckConfig(dir), null);
});

test("loadCheckConfig は .ai-check.yaml を検出し宣言順の steps を返す", async (t) => {
  // AC-03 / AC-04 / POST-02: YAML 検出、宣言順保持、enabled 既定 true、command 省略は null
  const dir = createTempDir(t);
  fs.writeFileSync(path.join(dir, CONFIG_YAML_NAME), YAML_FIXTURE);

  const config = await loadCheckConfig(dir);

  assert.equal(config.fileName, CONFIG_YAML_NAME);
  assert.equal(config.configPath, path.join(dir, CONFIG_YAML_NAME));
  assert.deepEqual(config.steps, [
    { name: "lint", command: "node -e \"console.log('lint')\"", enabled: true, gates: ["full", "fast"] },
    { name: "e2e", command: "node -e \"console.log('e2e')\"", enabled: false, gates: ["full"] },
    { name: "test:unit", command: null, enabled: true, gates: ["fast"] },
  ]);
});

test("同一スキーマの .ai-check.json は YAML と等価な解決結果になる", async (t) => {
  // AC-04: YAML/JSON 等価性（JSON は escape hatch としてフル表現をサポート）
  const yamlDir = createTempDir(t);
  const jsonDir = createTempDir(t);
  fs.writeFileSync(path.join(yamlDir, CONFIG_YAML_NAME), YAML_FIXTURE);
  fs.writeFileSync(path.join(jsonDir, CONFIG_JSON_NAME), JSON_FIXTURE);

  const yamlConfig = await loadCheckConfig(yamlDir);
  const jsonConfig = await loadCheckConfig(jsonDir);

  assert.equal(jsonConfig.fileName, CONFIG_JSON_NAME);
  assert.deepEqual(jsonConfig.steps, yamlConfig.steps);
});

test("YAML と JSON の併存は両ファイル名入り CliError になる", async (t) => {
  // AC-04 / 想定エラー4: 暗黙の優先順位で片方を silent に無視しない
  const dir = createTempDir(t);
  fs.writeFileSync(path.join(dir, CONFIG_YAML_NAME), YAML_FIXTURE);
  fs.writeFileSync(path.join(dir, CONFIG_JSON_NAME), JSON_FIXTURE);

  await assert.rejects(
    loadCheckConfig(dir),
    (error) =>
      assertCliError(error, /\.ai-check\.yaml/) &&
      assertCliError(error, /\.ai-check\.json/) &&
      assertCliError(error, /[Dd]elete one/),
  );
});

test("stepsForGate は該当 gate の step だけを宣言順で返す", () => {
  // FR-04 / POST-02: 該当 gate を gates に含む step の宣言順リストで全置換する
  const steps = validateCheckConfig(JSON.parse(JSON_FIXTURE), CONFIG_JSON_NAME);

  assert.deepEqual(stepsForGate(steps, "full").map((step) => step.name), ["lint", "e2e"]);
  assert.deepEqual(stepsForGate(steps, "fast").map((step) => step.name), ["lint", "test:unit"]);
  assert.deepEqual(stepsForGate(steps, "secure"), []);
});

test("YAML サブセットはインライン配列・`:` 入り step 名・quote・boolean を扱える", () => {
  // FR-02 / 実装メモ: version 行 + steps + ネストスカラー + インライン配列で
  // スキーマ v1 を全て表現できる（step 名の `:` は test:unit 等で必須）
  const parsed = parseConfigYaml(
    [
      "# comment line",
      "version: 1",
      "steps:",
      "  test:unit:",
      "    command: \"node -e 'x'\" # trailing comment",
      "    enabled: false",
      "    gates: [fast, full, secure]",
    ].join("\n"),
    CONFIG_YAML_NAME,
  );

  assert.deepEqual(parsed, {
    version: 1,
    steps: {
      "test:unit": {
        command: "node -e 'x'",
        enabled: false,
        gates: ["fast", "full", "secure"],
      },
    },
  });
});

test("YAML サブセット外の構造は .ai-check.json 案内付き CliError で拒否される", () => {
  // 想定エラー1 / OPS-02 / リスク2: サブセット外検出時のエラーに
  // `.ai-check.json` 案内を必須で含める
  const cases = [
    // ブロックリスト（`- item`）はサブセット外
    "version: 1\nsteps:\n  lint:\n    gates:\n      - fast\n",
    // 4 階層より深いネスト
    "version: 1\nsteps:\n  lint:\n    gates:\n        deep: 1\n",
    // タブインデント
    "version: 1\nsteps:\n\tlint:\n",
    // 親 mapping の無いネスト
    "version: 1\n  orphan: 1\n",
  ];

  for (const content of cases) {
    assert.throws(
      () => parseConfigYaml(content, CONFIG_YAML_NAME),
      (error) =>
        assertCliError(error, /\.ai-check\.yaml/) &&
        assertCliError(error, /\.ai-check\.json/),
      `should reject subset violation: ${JSON.stringify(content)}`,
    );
  }
});

test("不正 JSON はファイル名入り CliError になる", async (t) => {
  // FR-07(a) / AC-05: パース不能はステップ実行前に fail-fast
  const dir = createTempDir(t);
  fs.writeFileSync(path.join(dir, CONFIG_JSON_NAME), "{ not json");

  await assert.rejects(
    loadCheckConfig(dir),
    (error) => assertCliError(error, /\.ai-check\.json.*invalid JSON/),
  );
});

test("validation: version 欠落・1 以外は CliError になる", () => {
  // FR-07(b) / AC-05: version は必須で 1 のみ許可
  for (const raw of [
    { steps: { lint: { gates: ["fast"] } } },
    { version: 2, steps: { lint: { gates: ["fast"] } } },
    { version: "1", steps: { lint: { gates: ["fast"] } } },
  ]) {
    assert.throws(
      () => validateCheckConfig(raw, CONFIG_YAML_NAME),
      (error) => assertCliError(error, /\.ai-check\.yaml.*"version" must be 1/),
    );
  }
});

test("validation: 未知の最上位キーは CliError になる", () => {
  // FR-07(c) / AC-05
  assert.throws(
    () => validateCheckConfig({ version: 1, steps: { lint: { gates: ["fast"] } }, extra: 1 }, CONFIG_YAML_NAME),
    (error) => assertCliError(error, /unknown top-level key "extra"/),
  );
});

test("validation: step の型不正・未知キー・steps 空は CliError になる", () => {
  // FR-07(d) / AC-05 / 想定エラー3: 型不正（enabled が boolean 以外等）と未知キーを拒否
  const invalidCases = [
    // steps が mapping でない
    [{ version: 1, steps: [] }, /"steps" must be a mapping/],
    // steps が空
    [{ version: 1, steps: {} }, /at least one step/],
    // step が mapping でない
    [{ version: 1, steps: { lint: "typecheck" } }, /step "lint" must be a mapping/],
    // 未知 step キー
    [{ version: 1, steps: { lint: { gates: ["fast"], cmd: "x" } } }, /unknown key "cmd"/],
    // gates 欠落
    [{ version: 1, steps: { lint: { command: "x" } } }, /"gates" as a non-empty array/],
    // enabled が boolean 以外（想定エラー3）
    [{ version: 1, steps: { lint: { gates: ["fast"], enabled: "yes" } } }, /non-boolean "enabled"/],
  ];

  for (const [raw, pattern] of invalidCases) {
    assert.throws(
      () => validateCheckConfig(raw, CONFIG_YAML_NAME),
      (error) => assertCliError(error, pattern),
      `should reject: ${JSON.stringify(raw)}`,
    );
  }
});

test("validation: 未知 gate 値は CliError になる", () => {
  // FR-07(d) / AC-05: gates は fast / full / secure のみ
  assert.throws(
    () => validateCheckConfig({ version: 1, steps: { lint: { gates: ["full", "nightly"] } } }, CONFIG_YAML_NAME),
    (error) => assertCliError(error, /unknown gate value "nightly"/),
  );
});

test("validation: 空・空白のみの command は CliError になる", () => {
  // FR-07(e) / AC-05 / 想定エラー3
  for (const command of ["", "   ", 42]) {
    assert.throws(
      () => validateCheckConfig({ version: 1, steps: { lint: { command, gates: ["fast"] } } }, CONFIG_YAML_NAME),
      (error) => assertCliError(error, /empty or non-string "command"/),
      `should reject command: ${JSON.stringify(command)}`,
    );
  }
});

test("validation: step 名の識別子規則違反・重複は CliError になる", () => {
  // FR-07(f) / AC-05: step 名は [a-z][a-z0-9:_-]*、YAML 側は重複 step 名を拒否
  for (const name of ["Lint", "1lint", ":lint", "lint step"]) {
    assert.throws(
      () => validateCheckConfig({ version: 1, steps: { [name]: { gates: ["fast"] } } }, CONFIG_YAML_NAME),
      (error) => assertCliError(error, /invalid step name/),
      `should reject step name: ${name}`,
    );
  }

  assert.throws(
    () => parseConfigYaml("version: 1\nsteps:\n  lint:\n    gates: [fast]\n  lint:\n    gates: [full]\n", CONFIG_YAML_NAME),
    (error) => assertCliError(error, /duplicate step name "lint"/),
  );
});
