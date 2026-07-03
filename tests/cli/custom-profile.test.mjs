import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  loadCustomProfile,
  parseCustomProfileFlag,
  parseCustomProfileYaml,
  resolveCustomProfileDevDependencies,
  resolveCustomProfilePath,
  resolveCustomProfileScripts,
  validateCustomProfile,
} from "../../src/cli/custom-profile.mjs";
import {
  buildInstallState,
  loadInstallState,
  resolveEffectiveOptions,
  writeInstallState,
} from "../../src/cli/install-state.mjs";
import { supportedProfiles } from "../../src/cli/profile.mjs";
import { CliError } from "../../src/cli/utils.mjs";

// SPEC-0065 custom profile (TASK-0232 / TASK-0233 / TASK-0234). Expected values
// are derived from the SPEC contract (AC-01〜AC-08 / NFR-04 branches). The state
// tests for customProfile (AC-05) are consolidated here because the repo has no
// install-state-specific test file.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const binPath = path.join(repoRoot, "bin", "ai-check-template.mjs");

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [binPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
}

function createTempDir(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

function createFixture(t) {
  const dir = createTempDir(t, "ai-check-custom-");
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify({ name: "fixture", scripts: {} }, null, 2)}\n`);
  return dir;
}

function readPackageJson(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
}

function readInstallState(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, ".ai-check-template.json"), "utf8"));
}

function writeInstallStateRaw(dir, state) {
  fs.writeFileSync(path.join(dir, ".ai-check-template.json"), `${JSON.stringify(state, null, 2)}\n`);
}

// A valid custom profile definition file body. `test` is parameterized so tests
// can produce a drifting variant without duplicating the whole document.
function definitionYaml({ name = "mystack", test: testCommand = "vitest run" } = {}) {
  return [
    "version: 1",
    "profile:",
    `  name: ${name}`,
    "  gateScripts:",
    "    ai:check: [typecheck, lint, test]",
    "    ai:check:fast: [typecheck, lint]",
    "    ai:check:secure: myorg-scan --ci",
    "  supportScripts:",
    "    typecheck: tsc --noEmit",
    "    lint: eslint .",
    `    test: ${testCommand}`,
    "  devDependencies:",
    "    - typescript",
    "    - eslint",
    "    - vitest",
    "",
  ].join("\n");
}

// The same definition expressed as JSON (escape hatch, SPEC-0058 同方針).
function definitionJson({ name = "mystack" } = {}) {
  return {
    version: 1,
    profile: {
      name,
      gateScripts: {
        "ai:check": ["typecheck", "lint", "test"],
        "ai:check:fast": ["typecheck", "lint"],
        "ai:check:secure": "myorg-scan --ci",
      },
      supportScripts: {
        typecheck: "tsc --noEmit",
        lint: "eslint .",
        test: "vitest run",
      },
      devDependencies: ["typescript", "eslint", "vitest"],
    },
  };
}

function writeDefinitionYaml(dir, options) {
  const relative = ".ai-check-profile.yaml";
  fs.writeFileSync(path.join(dir, relative), definitionYaml(options));
  return relative;
}

function writeDefinitionJson(dir, options) {
  const relative = ".ai-check-profile.json";
  fs.writeFileSync(path.join(dir, relative), `${JSON.stringify(definitionJson(options), null, 2)}\n`);
  return relative;
}

// The rendered pnpm gate scripts a valid definition resolves to (AC-01 / AC-03).
const EXPECTED_PNPM_GATE = {
  "ai:check": "pnpm typecheck && pnpm lint && pnpm test",
  "ai:check:fast": "pnpm typecheck && pnpm lint",
  "ai:check:secure": "myorg-scan --ci",
};
const EXPECTED_SUPPORT = {
  typecheck: "tsc --noEmit",
  lint: "eslint .",
  test: "vitest run",
};

function initCustom(dir, relative, args = []) {
  return runCli([
    "init",
    "--target",
    dir,
    "--profile",
    "custom:mystack",
    "--profile-file",
    relative,
    "--ci",
    "none",
    "--yes",
    ...args,
  ]);
}

// ===========================================================================
// AC-01 / FR-03 / FR-04 / NFR-02: 定義ファイルの読み込み（YAML / JSON 両経路）
// NFR-04 分岐 (1): 定義ファイル YAML / JSON の読み込み成功
// ===========================================================================

test("AC-01: 妥当な YAML 定義から gate/support/deps が解決される", () => {
  // FR-03 / FR-04: YAML サブセットのパース → schema validation → 正規化
  const raw = parseCustomProfileYaml(definitionYaml(), ".ai-check-profile.yaml");
  const definition = validateCustomProfile(raw, ".ai-check-profile.yaml");

  assert.equal(definition.name, "mystack");
  assert.deepEqual(definition.gateScripts, EXPECTED_PNPM_GATE);
  assert.deepEqual(definition.supportScripts, EXPECTED_SUPPORT);
  assert.deepEqual(definition.devDependencies, ["typescript", "eslint", "vitest"]);
});

test("AC-01: 妥当な JSON 定義（escape hatch）が YAML と等価に解決される", () => {
  // FR-03 / NFR-02: `.json` escape hatch は YAML サブセットと同じ正規化結果になる
  const definition = validateCustomProfile(definitionJson(), ".ai-check-profile.json");

  assert.equal(definition.name, "mystack");
  assert.deepEqual(definition.gateScripts, EXPECTED_PNPM_GATE);
  assert.deepEqual(definition.supportScripts, EXPECTED_SUPPORT);
  assert.deepEqual(definition.devDependencies, ["typescript", "eslint", "vitest"]);
});

test("AC-01: loadCustomProfile が .yaml / .json 両経路で同一の正規化を返す", async (t) => {
  // FR-03 / FR-04: 拡張子判定で YAML / JSON パーサを選び、filePath を保持する
  const dir = createFixture(t);
  const yamlRelative = writeDefinitionYaml(dir);
  const jsonRelative = writeDefinitionJson(dir);

  const fromYaml = await loadCustomProfile(dir, yamlRelative);
  const fromJson = await loadCustomProfile(dir, jsonRelative);

  assert.equal(fromYaml.filePath, yamlRelative);
  assert.equal(fromJson.filePath, jsonRelative);
  assert.deepEqual(fromYaml.definition, fromJson.definition);
  assert.deepEqual(fromYaml.definition.gateScripts, EXPECTED_PNPM_GATE);
});

test("AC-01: YAML サブセットで表現できない深いネストは .json 案内付き CliError になる", () => {
  // NFR-02 / ASM-04: 3 段以上の mapping は YAML サブセット外 → .json escape hatch へ誘導
  const deepYaml = ["version: 1", "profile:", "  gateScripts:", "    ai:check:", "      nested: x"].join("\n");
  assert.throws(
    () => parseCustomProfileYaml(deepYaml, ".ai-check-profile.yaml"),
    (error) => error instanceof CliError && /nesting deeper than two mapping levels/.test(error.message)
      && /\.ai-check-profile\.json/.test(error.message),
  );
});

// ===========================================================================
// AC-02 / FR-03 / INV-06: schema 妥当性の fail-fast
// NFR-04 分岐 (2): schema 妥当性 各必須キーの欠落 / 型不正 / gate 欠落
// ===========================================================================

test("AC-02: version 欠落 / 1 以外は対象ファイル名と原因を含む CliError になる", () => {
  // FR-03 / INV-06: version は必須で 1 のみ
  const base = definitionJson();
  assert.throws(
    () => validateCustomProfile({ ...base, version: 2 }, "def.json"),
    (error) => error instanceof CliError && /def\.json/.test(error.message) && /"version" must be 1/.test(error.message),
  );
  const missing = { profile: base.profile };
  assert.throws(
    () => validateCustomProfile(missing, "def.json"),
    (error) => error instanceof CliError && /"version" must be 1/.test(error.message),
  );
});

test("AC-02: profile 欠落は CliError になる", () => {
  // FR-03: profile は必須の mapping
  assert.throws(
    () => validateCustomProfile({ version: 1 }, "def.json"),
    (error) => error instanceof CliError && /"profile" must be a mapping/.test(error.message),
  );
});

test("AC-02: profile.name の規則違反（大文字・メタ文字）は CliError になる", () => {
  // FR-03 / SEC-03: name は [a-z][a-z0-9-]*
  const base = definitionJson();
  for (const badName of ["MyStack", "my;rm", "my/stack", "1stack"]) {
    assert.throws(
      () => validateCustomProfile({ ...base, profile: { ...base.profile, name: badName } }, "def.json"),
      (error) => error instanceof CliError && /profile\.name must match \[a-z\]/.test(error.message),
      `name ${badName} should be rejected`,
    );
  }
});

test("AC-02: gateScripts の gate 3 種いずれかの欠落は CliError になる", () => {
  // FR-03: ai:check / ai:check:fast / ai:check:secure を網羅すること
  const base = definitionJson();
  const gateScripts = { ...base.profile.gateScripts };
  delete gateScripts["ai:check:secure"];
  assert.throws(
    () => validateCustomProfile({ ...base, profile: { ...base.profile, gateScripts } }, "def.json"),
    (error) => error instanceof CliError && /gateScripts is missing "ai:check:secure"/.test(error.message),
  );
});

test("AC-02: supportScripts 欠落は CliError になる", () => {
  // FR-03: supportScripts は必須の mapping
  const base = definitionJson();
  const profileWithoutSupport = { name: base.profile.name, gateScripts: base.profile.gateScripts };
  assert.throws(
    () => validateCustomProfile({ version: 1, profile: profileWithoutSupport }, "def.json"),
    (error) => error instanceof CliError && /supportScripts must be a mapping/.test(error.message),
  );
});

test("AC-02: gateScripts が参照する step 実体が supportScripts に無いと CliError になる", () => {
  // FR-03 / 参照整合: list 形式 gate の各 step は supportScripts に定義が必要
  const badRef = {
    version: 1,
    profile: {
      name: "mystack",
      gateScripts: { "ai:check": ["ghost"], "ai:check:fast": "run fast", "ai:check:secure": "run secure" },
      supportScripts: { typecheck: "tsc --noEmit" },
    },
  };
  assert.throws(
    () => validateCustomProfile(badRef, "def.json"),
    (error) => error instanceof CliError
      && /references step "ghost" that is not defined in supportScripts/.test(error.message),
  );
});

test("AC-02: 未知の最上位キー / profile 直下キーは CliError になる", () => {
  // FR-03: 未知キーは silent 無視せず fail-fast
  const base = definitionJson();
  assert.throws(
    () => validateCustomProfile({ ...base, extra: 1 }, "def.json"),
    (error) => error instanceof CliError && /unknown top-level key "extra"/.test(error.message),
  );
  assert.throws(
    () => validateCustomProfile({ ...base, profile: { ...base.profile, extra: 1 } }, "def.json"),
    (error) => error instanceof CliError && /profile has unknown key "extra"/.test(error.message),
  );
});

test("AC-02: 型不正（gateScripts が mapping でない）は CliError になる", () => {
  // FR-03 / INV-06: 型不正の定義を silent に適用しない
  const bad = {
    version: 1,
    profile: { name: "mystack", gateScripts: "not-a-mapping", supportScripts: { typecheck: "tsc" } },
  };
  assert.throws(
    () => validateCustomProfile(bad, "def.json"),
    (error) => error instanceof CliError && /gateScripts must be a mapping/.test(error.message),
  );
});

test("AC-02: schema 不正の init は package.json に書き込まず非 0 終了する（INV-06）", (t) => {
  // FR-03 / INV-06 / 想定エラー2: 部分書き込みの不在
  const dir = createFixture(t);
  const before = readPackageJson(dir);
  fs.writeFileSync(path.join(dir, ".ai-check-profile.json"), `${JSON.stringify({ version: 1, profile: { name: "mystack" } }, null, 2)}\n`);

  const result = initCustom(dir, ".ai-check-profile.json");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /supportScripts|gateScripts/);
  assert.deepEqual(readPackageJson(dir), before);
  assert.equal(fs.existsSync(path.join(dir, ".ai-check-template.json")), false);
});

// ===========================================================================
// AC-03 unit / FR-04 / FR-05 / INV-03: 生成される scripts が定義由来で非空
// NFR-04 分岐 (4): 生成 scripts（gate + support）の内容
// ===========================================================================

test("AC-03(unit): resolveCustomProfileScripts が定義由来の非空 gate + support を返す", () => {
  // FR-04 / FR-05 / INV-03 / リスク2: built-in テーブル未参照・silent 空 scripts に到達しない
  const definition = validateCustomProfile(definitionJson(), "def.json");
  const resolved = resolveCustomProfileScripts(definition, { packageManager: "pnpm" });

  assert.deepEqual(resolved.gateScripts, EXPECTED_PNPM_GATE);
  assert.deepEqual(resolved.supportScripts, EXPECTED_SUPPORT);
  // リスク2: 各 gate は非空文字列（空 {} 生成の縮退経路に落ちていない）
  for (const gate of Object.values(resolved.gateScripts)) {
    assert.equal(typeof gate, "string");
    assert.ok(gate.length > 0);
  }
});

test("AC-03(unit): gate scripts は PM 別に描画される（npm / yarn）", () => {
  // FR-05: `pnpm <step>` list 形式は package manager 別に変換される
  const definition = validateCustomProfile(definitionJson(), "def.json");
  const npm = resolveCustomProfileScripts(definition, { packageManager: "npm" });
  assert.equal(npm.gateScripts["ai:check"], "npm run typecheck && npm run lint && npm run test");
  const yarn = resolveCustomProfileScripts(definition, { packageManager: "yarn" });
  assert.equal(yarn.gateScripts["ai:check"], "yarn typecheck && yarn lint && yarn test");
  // 文字列 gate（step 名でない）はそのまま維持される
  assert.equal(npm.gateScripts["ai:check:secure"], "myorg-scan --ci");
});

test("AC-03(unit): devDependencies は定義由来（built-in 依存テーブル未参照）", () => {
  // FR-05 / INV-03: custom deps は定義の devDependencies から解決する
  const definition = validateCustomProfile(definitionJson(), "def.json");
  assert.deepEqual(resolveCustomProfileDevDependencies(definition), ["typescript", "eslint", "vitest"]);
});

// ===========================================================================
// AC-04 unit / FR-02: custom モード判定と profile 名（unit 部分）
// NFR-04 分岐 (3): custom モード判定（custom:<name> 形式 / built-in 名併用エラー）
// ===========================================================================

test("AC-04(unit): parseCustomProfileFlag が custom:<name> から name を返す", () => {
  // FR-02: `custom:` 接頭辞を剥がして <name> を返す
  assert.equal(parseCustomProfileFlag("custom:mystack"), "mystack");
  assert.equal(parseCustomProfileFlag("custom:my-stack-2"), "my-stack-2");
});

test("AC-04(unit): built-in 名の parseCustomProfileFlag は併用禁止の CliError になる", () => {
  // FR-02 / 想定エラー3: built-in 名 + --profile-file は fail-fast
  for (const builtin of supportedProfiles) {
    assert.throws(
      () => parseCustomProfileFlag(builtin),
      (error) => error instanceof CliError && /custom profiles only/.test(error.message)
        && error.message.includes(builtin),
      `${builtin} should be rejected as built-in`,
    );
  }
});

test("AC-04(unit): custom: 接頭辞なし / 規則違反の flag は CliError になる", () => {
  // FR-02: custom:<name> 形式（<name> = [a-z][a-z0-9-]*）でなければ拒否
  for (const bad of ["mystack", "custom:My", "custom:my;rm", "custom:", "custom:1x"]) {
    assert.throws(
      () => parseCustomProfileFlag(bad),
      (error) => error instanceof CliError && /--profile-file requires --profile custom:<name>/.test(error.message),
      `${bad} should be rejected`,
    );
  }
});

// ===========================================================================
// AC-07 unit / SEC-02 / SEC-03 / INV-04: パストラバーサル・メタ文字の unit 検証
// ===========================================================================

test("AC-07(unit): 絶対パス / .. 入り / 空の profileFilePath は SEC-02 の CliError になる", () => {
  // SEC-02 / INV-04: --target 外の読み込み経路を作らない
  const target = path.join(os.tmpdir(), "target");
  for (const bad of ["/etc/passwd", "../outside.yaml", "sub/../../escape.yaml", ""]) {
    assert.throws(
      () => resolveCustomProfilePath(target, bad),
      (error) => error instanceof CliError,
      `path ${JSON.stringify(bad)} should be rejected`,
    );
  }
  // 正常な相対パスは target 配下に解決される
  const resolved = resolveCustomProfilePath(target, "sub/def.yaml");
  assert.equal(resolved, path.join(target, "sub", "def.yaml"));
});

test("AC-07(unit): メタ文字入りの name / step 名は SEC-03 の CliError になる", () => {
  // SEC-03 / INV-04: シェルメタ文字・パスセパレータ入りの名前は埋め込み前に弾く
  const withBadStepName = {
    version: 1,
    profile: {
      name: "mystack",
      gateScripts: { "ai:check": "x", "ai:check:fast": "y", "ai:check:secure": "z" },
      supportScripts: { "bad name": "cmd" },
    },
  };
  assert.throws(
    () => validateCustomProfile(withBadStepName, "def.json"),
    (error) => error instanceof CliError && /invalid support script name/.test(error.message),
  );
});

// ===========================================================================
// AC-05 / FR-06 / FR-07 / SEC-02 / INV-05: install state の custom 記録・round-trip
// （install-state 専用テストファイルが無いため customProfile の state テストをここに集約）
// NFR-04 分岐 (5): state customProfile の記録 / 欠落 / 不正
// ===========================================================================

const STATE_CUSTOM = {
  name: "mystack",
  filePath: ".ai-check-profile.yaml",
  definition: {
    gateScripts: EXPECTED_PNPM_GATE,
    supportScripts: EXPECTED_SUPPORT,
    devDependencies: ["typescript", "eslint", "vitest"],
  },
};

test("AC-05: buildInstallState は customProfile を additive 記録し schemaVersion は 2 のまま", async () => {
  // FR-06 / INV-05: customProfile 記録あり state は schemaVersion 2 で valid
  const state = await buildInstallState({
    profile: "react-nextjs",
    ci: "none",
    claudeHooks: false,
    reviewTemplates: false,
    packageManager: "pnpm",
    managedFiles: {},
    customProfile: STATE_CUSTOM,
  });

  assert.equal(state.schemaVersion, 2);
  assert.equal("customProfile" in state, true);
  assert.equal(state.customProfile.name, "mystack");
  assert.deepEqual(state.customProfile.definition.gateScripts, EXPECTED_PNPM_GATE);
});

test("AC-05: built-in モードの state には customProfile キーが存在しない", async () => {
  // FR-06 / INV-05: customProfile なし = built-in、の 2 状態のみ（null / 空を書かない）
  const state = await buildInstallState({
    profile: "react-nextjs",
    ci: "none",
    claudeHooks: false,
    reviewTemplates: false,
    packageManager: "pnpm",
    managedFiles: {},
  });

  assert.equal("customProfile" in state, false);
});

test("AC-05: customProfile 付き state は loadInstallState で round-trip valid", async (t) => {
  // FR-06 / INV-05: 書き込み → 読み込みで customProfile が保存される
  const dir = createFixture(t);
  await writeInstallState(dir, {
    profile: "react-nextjs",
    ci: "none",
    claudeHooks: false,
    reviewTemplates: false,
    packageManager: "pnpm",
    managedFiles: {},
    customProfile: STATE_CUSTOM,
  });

  const loaded = await loadInstallState(dir);
  assert.equal(loaded.source, "state");
  assert.equal(loaded.state.customProfile.name, "mystack");
  assert.deepEqual(loaded.state.customProfile.definition.supportScripts, EXPECTED_SUPPORT);
});

test("AC-05: 絶対パス / .. 入り filePath の customProfile state は invalid-install-state になる", async (t) => {
  // SEC-02 / 想定エラー5: state 改竄でルート外読み込みを誘発できない
  const dir = createFixture(t);
  const baseState = await buildInstallState({
    profile: "react-nextjs",
    ci: "none",
    claudeHooks: false,
    reviewTemplates: false,
    packageManager: "pnpm",
    managedFiles: {},
    customProfile: STATE_CUSTOM,
  });

  for (const badFilePath of ["/abs/def.yaml", "../def.yaml"]) {
    writeInstallStateRaw(dir, { ...baseState, customProfile: { ...STATE_CUSTOM, filePath: badFilePath } });
    const loaded = await loadInstallState(dir);
    assert.equal(loaded.source, "invalid", `filePath ${badFilePath} should be invalid`);
    assert.equal(loaded.error.code, "invalid-install-state");
  }
});

test("AC-05: gate 3 種を欠く definition / 非文字列 name の customProfile state は invalid になる", async (t) => {
  // 想定エラー5 / INV-05: definition の gate 網羅・name 型を存在時に検証
  const dir = createFixture(t);
  const baseState = await buildInstallState({
    profile: "react-nextjs",
    ci: "none",
    claudeHooks: false,
    reviewTemplates: false,
    packageManager: "pnpm",
    managedFiles: {},
    customProfile: STATE_CUSTOM,
  });

  writeInstallStateRaw(dir, {
    ...baseState,
    customProfile: {
      ...STATE_CUSTOM,
      definition: { gateScripts: { "ai:check": "x" }, supportScripts: {}, devDependencies: [] },
    },
  });
  assert.equal((await loadInstallState(dir)).source, "invalid");

  writeInstallStateRaw(dir, { ...baseState, customProfile: { ...STATE_CUSTOM, name: 123 } });
  assert.equal((await loadInstallState(dir)).source, "invalid");
});

test("AC-05: customProfile 無しの既存 v2 state は従来どおり valid（後方互換）", async (t) => {
  // NFR-03 / 後方互換: customProfile を持たない v2 state の読み込み結果は不変
  const dir = createFixture(t);
  const state = await buildInstallState({
    profile: "react-nextjs",
    ci: "none",
    claudeHooks: false,
    reviewTemplates: false,
    packageManager: "pnpm",
    managedFiles: {},
  });
  writeInstallStateRaw(dir, state);

  const loaded = await loadInstallState(dir);
  assert.equal(loaded.source, "state");
  assert.equal("customProfile" in loaded.state, false);
});

test("AC-05: v1 state（customProfile / managedFiles なし）も従来どおり valid", async (t) => {
  // NFR-03 / SPEC-0056: v1 state は customProfile 追加後も valid のまま
  const dir = createFixture(t);
  writeInstallStateRaw(dir, {
    schemaVersion: 1,
    packageName: "ai-check-template",
    packageVersion: "0.1.0",
    profile: { base: "react-nextjs", addons: [], all: ["react-nextjs"] },
    packageManager: "pnpm",
    ci: "none",
    claudeHooks: false,
    managedBy: "ai-check-template",
  });

  assert.equal((await loadInstallState(dir)).source, "state");
});

test("AC-05: resolveEffectiveOptions は explicit --profile-file > state > null で解決する", () => {
  // FR-07 / PRE-02: 決定的な優先順（環境非依存）。custom モード（explicit
  // --profile-file あり）では profile 入力を built-in placeholder に差し替えて
  // parseProfiles を回避するので、profile: "custom:mystack" を明示しても throw
  // せず profileFile / customProfile の解決だけを返す（F1 修正の unit 側）。
  const stateInstall = {
    source: "state",
    state: {
      profile: { base: "react-nextjs", addons: [], all: ["react-nextjs"] },
      packageManager: "pnpm",
      ci: "none",
      claudeHooks: false,
      reviewTemplates: false,
      customProfile: STATE_CUSTOM,
    },
    error: null,
  };

  // state からの解決（explicit なし）
  const fromState = resolveEffectiveOptions({ profile: "react-nextjs", explicit: {} }, stateInstall);
  assert.equal(fromState.customProfile.name, "mystack");
  assert.equal(fromState.profileFile, null);

  // explicit --profile-file 優先（state customProfile は使わない）
  const explicit = resolveEffectiveOptions(
    { profile: "custom:mystack", profileFile: "other.yaml", explicit: { profileFile: true } },
    stateInstall,
  );
  assert.equal(explicit.profileFile, "other.yaml");
  assert.equal(explicit.customProfile, null);

  // state も explicit も無ければ null（built-in 動作）
  const none = resolveEffectiveOptions(
    { profile: "react-nextjs", explicit: {} },
    { source: "defaults", state: null, error: null },
  );
  assert.equal(none.customProfile, null);
  assert.equal(none.profileFile, null);
});

// ===========================================================================
// AC-03 integration / FR-04 / FR-05 / INV-03: init での scripts / deps / docs 生成
// ===========================================================================

test("AC-03: init --profile custom:mystack が gate + support scripts を merge する（PM 別描画）", (t) => {
  // FR-04 / FR-05 / INV-03: 定義由来の非空 scripts が生成され、built-in テーブルに到達しない
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  const result = initCustom(dir, relative);

  assert.equal(result.status, 0, result.stderr);
  const scripts = readPackageJson(dir).scripts;
  assert.equal(scripts["ai:check"], EXPECTED_PNPM_GATE["ai:check"]);
  assert.equal(scripts["ai:check:fast"], EXPECTED_PNPM_GATE["ai:check:fast"]);
  assert.equal(scripts["ai:check:secure"], EXPECTED_PNPM_GATE["ai:check:secure"]);
  assert.equal(scripts.typecheck, "tsc --noEmit");
  assert.equal(scripts.lint, "eslint .");
  assert.equal(scripts.test, "vitest run");
  // リスク2: gate scripts は非空（silent 空 {} に落ちていない）
  assert.ok(scripts["ai:check"].length > 0);
});

test("AC-03: init --profile-file の gate scripts は npm で PM 別描画される", (t) => {
  // FR-05: package manager 別変換が custom 経路にも適用される
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  const result = initCustom(dir, relative, ["--package-manager", "npm"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    readPackageJson(dir).scripts["ai:check"],
    "npm run typecheck && npm run lint && npm run test",
  );
});

test("AC-03: custom docs は custom-<name>/README.md の relativePath で扱われ、未同梱なら skip される", (t) => {
  // FR-05 / ASM-02 / 境界ケース1: getProfileDocFiles の汎用パスを通す（CLI は README を生成しない）
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  const result = initCustom(dir, relative, ["--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  const customDocOp = output.operations.find((op) => (
    typeof op.targetPath === "string"
    && op.targetPath.endsWith(path.join("docs", "ai-check-template", "profiles", "custom-mystack", "README.md"))
  ));
  assert.ok(customDocOp, "custom profile doc operation should be present");
  assert.equal(customDocOp.action, "skip");
  // README は生成されない
  assert.equal(
    fs.existsSync(path.join(dir, "docs", "ai-check-template", "profiles", "custom-mystack", "README.md")),
    false,
  );
});

test("AC-03: --install-deps 対象の dev dependencies が定義の devDependencies と一致する", (t) => {
  // FR-05 / INV-03: install 計画は定義由来（built-in 依存テーブル未参照）
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  const emptyPath = createTempDir(t, "ai-check-empty-path-");
  const result = initCustom(dir, relative, ["--install-deps", "--dry-run", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  const depOperation = output.operations.find((op) => op.command);
  assert.ok(depOperation, "dependency install operation should be present");
  assert.equal(depOperation.command, "pnpm add -D typescript eslint vitest");
  // dry-run は何も install しない
  assert.equal(fs.existsSync(path.join(dir, "pnpm-lock.yaml")), false);
  // emptyPath は未使用だが lint 対策で参照
  assert.ok(fs.existsSync(emptyPath));
});

// ===========================================================================
// AC-04 integration / FR-02 / 想定エラー3 / 境界ケース2: custom モード判定
// ===========================================================================

test("AC-04: built-in 名に --profile-file を併用すると CliError になり書き込まない", (t) => {
  // FR-02 / 想定エラー3: --profile-file は custom モード専用
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  const before = readPackageJson(dir);
  const result = runCli([
    "init", "--target", dir, "--profile", "react-nextjs", "--profile-file", relative, "--ci", "none", "--yes",
  ]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /custom profiles only/);
  assert.deepEqual(readPackageJson(dir), before);
  assert.equal(fs.existsSync(path.join(dir, ".ai-check-template.json")), false);
});

test("AC-04: custom: 接頭辞なしの --profile は CliError になる", (t) => {
  // FR-02: --profile-file には --profile custom:<name> が必要
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  const result = runCli([
    "init", "--target", dir, "--profile", "mystack", "--profile-file", relative, "--ci", "none", "--yes",
  ]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires --profile custom:<name>/);
});

test("AC-04: 定義ファイル profile.name と --profile custom:<name> の不一致は CliError になる", (t) => {
  // FR-02: 定義の name は flag の <name> と一致すること
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir, { name: "otherstack" });
  const result = runCli([
    "init", "--target", dir, "--profile", "custom:mystack", "--profile-file", relative, "--ci", "none", "--yes",
  ]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /does not match the definition file's profile\.name "otherstack"/);
});

test("AC-04: 境界ケース2 — --profile-file あり + --profile 既定値（react-nextjs）は CliError になる", (t) => {
  // FR-02 / 境界ケース2: 既定の built-in 名では custom モードに入れない
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  const result = runCli([
    "init", "--target", dir, "--profile-file", relative, "--ci", "none", "--yes",
  ]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /custom profiles only/);
});

test("AC-04: --profile-file の 2 回指定は CliError になる（単一指定制限）", (t) => {
  // FR-01: --profile-file は単一指定
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  const result = runCli([
    "init", "--target", dir, "--profile", "custom:mystack",
    "--profile-file", relative, "--profile-file", "other.yaml", "--ci", "none", "--yes",
  ]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /can only be specified once/);
});

test("AC-04: --profile-file 未指定時は従来どおり built-in が解決される（NFR-01）", (t) => {
  // FR-01 / NFR-01 / INV-01: opt-in の完全性 — built-in 経路は不変
  const dir = createFixture(t);
  const result = runCli(["init", "--target", dir, "--profile", "react-nextjs", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const state = readInstallState(dir);
  assert.equal("customProfile" in state, false);
  assert.deepEqual(state.profile, { base: "react-nextjs", addons: [], all: ["react-nextjs"] });
});

// ===========================================================================
// AC-05 integration / FR-06 / FR-07 / POST-01 / POST-02: init→state→doctor→update
// ===========================================================================

test("AC-05: init --profile-file 後の state に customProfile が記録される（POST-01）", (t) => {
  // FR-06 / POST-01: init が custom snapshot を記録し、直後の doctor が pass する
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  const initResult = initCustom(dir, relative);
  assert.equal(initResult.status, 0, initResult.stderr);

  const state = readInstallState(dir);
  assert.equal(state.schemaVersion, 2);
  assert.equal(state.customProfile.name, "mystack");
  assert.equal(state.customProfile.filePath, relative);
  assert.deepEqual(state.customProfile.definition.gateScripts, EXPECTED_PNPM_GATE);
  // built-in placeholder は保持されるが custom が実体
  assert.deepEqual(state.profile, { base: "react-nextjs", addons: [], all: ["react-nextjs"] });

  // POST-01: 直後の doctor（フラグなし）は custom モードで pass
  const doctorResult = runCli(["doctor", "--target", dir, "--ci", "none", "--json"]);
  assert.equal(doctorResult.status, 0, doctorResult.stderr);
  const doctorOutput = JSON.parse(doctorResult.stdout);
  assert.equal(doctorOutput.status, "pass");
  assert.equal(doctorOutput.effectiveOptions.profile, "custom:mystack");
});

test("AC-05: update（customProfile state あり、フラグなし）が custom 配置規則で更新し customProfile を維持する（POST-02）", (t) => {
  // FR-07 / POST-02: 定義ファイルを再解決して snapshot を維持・更新する。既存 support
  // script は init と同じ配置規則（keep）で保持され、state snapshot は編集を反映する。
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  assert.equal(initCustom(dir, relative).status, 0);

  // 定義ファイルの test コマンドを変更
  writeDefinitionYaml(dir, { test: "vitest run --changed" });
  const updateResult = runCli(["update", "--target", dir, "--ci", "none", "--yes"]);
  assert.equal(updateResult.status, 0, updateResult.stderr);

  // 既存 support script は保持される（keep 規則。custom も built-in と同じ配置規則）
  assert.equal(readPackageJson(dir).scripts.test, "vitest run");
  // customProfile は維持され、再解決した definition snapshot は編集を反映する
  const state = readInstallState(dir);
  assert.equal(state.customProfile.name, "mystack");
  assert.equal(state.customProfile.filePath, relative);
  assert.equal(state.customProfile.definition.supportScripts.test, "vitest run --changed");
});

test("AC-05: 定義ファイル不在の update は CliError で部分書き込みしない（想定エラー1）", (t) => {
  // FR-07 / 想定エラー1: 定義ファイル不在なら fail-fast（部分書き込みなし）
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  assert.equal(initCustom(dir, relative).status, 0);

  fs.rmSync(path.join(dir, relative));
  const before = fs.readFileSync(path.join(dir, "package.json"), "utf8");
  const updateResult = runCli(["update", "--target", dir, "--ci", "none", "--yes"]);

  assert.notEqual(updateResult.status, 0);
  assert.match(updateResult.stderr, /definition file not found/);
  assert.equal(fs.readFileSync(path.join(dir, "package.json"), "utf8"), before);
});

// ===========================================================================
// F1 回帰 / FR-07 / AC-04 / AC-07 (TASK-0234): explicit --profile custom:<name>
// --profile-file を doctor / update に渡した経路。F1 修正前は
// resolveEffectiveOptions が custom:<name> を parseProfiles に通して
// "Invalid profile" で exit 1 になっていた（init だけが resolveEffectiveOptions
// を profile 解決に使わないため通っていた）。修正後は custom モードで built-in
// placeholder に差し替え、caller の custom 解決経路（resolveDoctorCustomProfile /
// resolveUpdateCustomProfile）に委ねるため exit 0 で custom を扱う。
// 期待値は SPEC の FR-07 / AC-04（custom:<name> 判定）/ AC-07（doctor の custom
// 診断）から導出（AP-07）。
// ===========================================================================

test("F1: doctor に explicit --profile custom:<name> --profile-file を渡すと exit 0 で custom を診断する", (t) => {
  // FR-07 / AC-04 / AC-07: 明示フラグ経路（旧: exit 1）。state 駆動ではなく
  // フラグ由来で custom を解決し、effectiveOptions.profile が custom:<name> になる。
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  assert.equal(initCustom(dir, relative).status, 0);

  const result = runCli([
    "doctor", "--target", dir, "--profile", "custom:mystack", "--profile-file", relative, "--ci", "none", "--json",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.effectiveOptions.profile, "custom:mystack");
  assert.equal(output.effectiveOptions.profileFile, relative);
});

test("F1: update に explicit --profile custom:<name> --profile-file を渡すと exit 0 で custom を更新する", (t) => {
  // FR-07 / AC-04: 明示フラグ経路（旧: exit 1）。custom snapshot を維持したまま
  // 更新でき、state の customProfile が保持される（built-in placeholder に落ちない）。
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  assert.equal(initCustom(dir, relative).status, 0);

  const result = runCli([
    "update", "--target", dir, "--profile", "custom:mystack", "--profile-file", relative, "--ci", "none", "--yes", "--json",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "updated");
  assert.equal(output.effectiveOptions.profile, "custom:mystack");
  // custom snapshot は維持される（F1 修正で placeholder に潰されない）
  const state = readInstallState(dir);
  assert.equal(state.customProfile.name, "mystack");
  assert.equal(state.customProfile.filePath, relative);
});

test("F1: built-in の explicit --profile react-nextjs は doctor / update で従来どおり exit 0（後方互換）", (t) => {
  // FR-07 / NFR-01 / INV-01: built-in の明示フラグ経路は F1 修正の影響を受けない。
  const dir = createFixture(t);
  assert.equal(
    runCli(["init", "--target", dir, "--profile", "react-nextjs", "--ci", "none", "--yes"]).status,
    0,
  );

  const doctorResult = runCli([
    "doctor", "--target", dir, "--profile", "react-nextjs", "--ci", "none", "--json",
  ]);
  assert.equal(doctorResult.status, 0, doctorResult.stderr);
  assert.equal(JSON.parse(doctorResult.stdout).effectiveOptions.profile, "react-nextjs");

  const updateResult = runCli([
    "update", "--target", dir, "--profile", "react-nextjs", "--ci", "none", "--yes", "--json",
  ]);
  assert.equal(updateResult.status, 0, updateResult.stderr);
  assert.equal(JSON.parse(updateResult.stdout).effectiveOptions.profile, "react-nextjs");
  // built-in モードは customProfile を書かない（INV-05）
  assert.equal("customProfile" in readInstallState(dir), false);
});

// ===========================================================================
// AC-07 integration / FR-07 / SEC-02 / SEC-03: doctor の custom 診断と異常系
// NFR-04 分岐 (6): doctor の定義ファイル不在 / drift 検出
// ===========================================================================

test("AC-07(a): 定義ファイル不在の doctor は missing-profile-file を issue（非 0）として報告する", (t) => {
  // FR-07 (a) / 想定エラー1: 削除された定義ファイルを issue 化
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  assert.equal(initCustom(dir, relative).status, 0);

  fs.rmSync(path.join(dir, relative));
  const result = runCli(["doctor", "--target", dir, "--ci", "none", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.ok(output.issues.some((currentIssue) => currentIssue.code === "missing-profile-file"));
});

test("AC-07(b): 定義ファイルが state snapshot から drift すると profile-file-drift を報告する", (t) => {
  // FR-07 (b): 定義ファイル内容と state snapshot の差分を drift issue 化
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  assert.equal(initCustom(dir, relative).status, 0);

  // 定義ファイルを編集（update せず）→ state snapshot と乖離
  writeDefinitionYaml(dir, { test: "vitest run --changed" });
  const result = runCli(["doctor", "--target", dir, "--ci", "none", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.ok(output.issues.some((currentIssue) => currentIssue.code === "profile-file-drift"));
});

test("AC-07(c): 対象 package.json の gate scripts drift を drift issue として報告する", (t) => {
  // FR-07 (c): package.json の gate/support scripts を definition 期待値と照合
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  assert.equal(initCustom(dir, relative).status, 0);

  const packageJson = readPackageJson(dir);
  packageJson.scripts["ai:check"] = "pnpm something-else";
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);

  const result = runCli(["doctor", "--target", dir, "--ci", "none", "--json"]);
  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.ok(output.issues.some(
    (currentIssue) => currentIssue.code === "drift" && /ai:check/.test(currentIssue.message),
  ));
});

test("AC-07: custom モードの doctor は base 別 diagnostics を発火しない", (t) => {
  // FR-07 / INV-03: diagnoseProfileScripts（base 別 if）は custom では呼ばれない
  const dir = createFixture(t);
  const relative = writeDefinitionYaml(dir);
  assert.equal(initCustom(dir, relative).status, 0);

  const result = runCli(["doctor", "--target", dir, "--ci", "none", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  // base 別 diagnostics は profile-advice 系 warning を出す。custom では 0 件。
  assert.equal(output.warnings.length, 0);
});

test("AC-07: init で --profile-file の絶対パス / .. 入りは SEC-02 の CliError になり書き込まない", (t) => {
  // SEC-02 / 想定エラー4: パストラバーサル・絶対パスを init 経路で弾く（部分書き込みなし）
  const dir = createFixture(t);
  writeDefinitionYaml(dir);

  const traversal = runCli([
    "init", "--target", dir, "--profile", "custom:mystack", "--profile-file", "../outside.yaml", "--ci", "none", "--yes",
  ]);
  assert.notEqual(traversal.status, 0);
  assert.match(traversal.stderr, /must not contain "\.\." segments/);

  const absolute = runCli([
    "init", "--target", dir, "--profile", "custom:mystack", "--profile-file", "/etc/passwd", "--ci", "none", "--yes",
  ]);
  assert.notEqual(absolute.status, 0);
  assert.match(absolute.stderr, /must be a relative path/);

  assert.equal(fs.existsSync(path.join(dir, ".ai-check-template.json")), false);
});

test("AC-07: doctor の --profile-file 絶対パス / .. 入り（explicit custom）も CliError になる", (t) => {
  // SEC-02 / FR-07: doctor でも不正パスは非 0 終了する。F1 修正後、explicit
  // --profile custom:<name> は resolveEffectiveOptions で built-in placeholder に
  // 差し替わり parseProfiles ガードを通過するため、非 0 の由来は
  // resolveDoctorCustomProfile 内の resolveCustomProfilePath（SEC-02 パス検証）に
  // 移る。観測結果（status≠0・書き込みなし）は F1 修正前後で同一。
  const dir = createFixture(t);
  writeDefinitionYaml(dir);

  const traversal = runCli([
    "doctor", "--target", dir, "--profile", "custom:mystack", "--profile-file", "../outside.yaml", "--ci", "none", "--json",
  ]);
  assert.notEqual(traversal.status, 0);

  const absolute = runCli([
    "doctor", "--target", dir, "--profile", "custom:mystack", "--profile-file", "/etc/passwd", "--ci", "none", "--json",
  ]);
  assert.notEqual(absolute.status, 0);
});

// ===========================================================================
// AC-06 / NFR-01 / INV-02: built-in スナップショット不変の回帰
// NFR-04 分岐 (7): built-in 8 組合せスナップショット不変
// ===========================================================================

test("AC-06: supportedProfiles は 5 件のままで custom 名を含まない（8 組合せ不変の要）", () => {
  // NFR-01 / INV-02 / FR-08: custom は supportedProfiles に足さない別経路
  assert.equal(supportedProfiles.length, 5);
  assert.deepEqual(
    [...supportedProfiles].sort(),
    ["expo-rn", "node-cli", "react-nextjs", "react-vanilla", "supabase-rls"],
  );
  assert.equal(supportedProfiles.includes("mystack"), false);
  assert.equal(supportedProfiles.includes("custom-mystack"), false);
  assert.equal(supportedProfiles.includes("custom:mystack"), false);
});

// ===========================================================================
// AC-08 / FR-08 / SEC-01 / SEC-04: docs/cli.md の custom profile 記載
// ===========================================================================

test("AC-08: docs/cli.md に custom profile 節（--profile-file / schema / 棲み分け / 信頼境界）がある", () => {
  // FR-08 / SEC-01 / SEC-04: docs の静的検証（grep 相当）
  const cliDoc = fs.readFileSync(path.join(repoRoot, "docs", "cli.md"), "utf8");
  assert.match(cliDoc, /--profile-file/);
  assert.match(cliDoc, /custom:<name>/);
  // schema の 4 キー
  assert.match(cliDoc, /version: 1/);
  assert.match(cliDoc, /gateScripts/);
  assert.match(cliDoc, /supportScripts/);
  assert.match(cliDoc, /devDependencies/);
  // built-in との棲み分け（supportedProfiles に足さない）
  assert.match(cliDoc, /supportedProfiles/);
  // 信頼境界 + secret 非直書き案内
  assert.match(cliDoc, /secret|token|API key/i);
});
