import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// SPEC-0064: supabase-rls addon に同梱する authz / RLS 無視の典型失敗検出用
// Semgrep ルール例（package-templates/supabase/semgrep/authz-rules.yml）と、その
// opt-in 適用手順を案内する 3 docs の静的検証。
//
// 観測面（NFR-01）: ルール YAML は配布物であり、本リポ CI では実 Semgrep スキャンを
// 利用者コードに対して回さない。observable なのは「ルール YAML の内容」と
// 「README / prompt の追記内容」なので、テストは静的検証（YAML schema 妥当性 +
// meta 健全性 + docs の grep）に限る。実際の検出 / 誤検知挙動は利用者環境 +
// semgrep バイナリの前提でありスコープ外。
//
// 期待値は SPEC-0064 の契約節・AC-01〜AC-05 / FR-01〜FR-06 / NFR-04 から導出する
// （AP-07 対策: 実装内部を読んで期待値を作らない）。
// 依存追加ゼロ = Node 標準（node:test / node:assert / node:fs / node:child_process）
// + YAML パースは ci-workflows.test.mjs 先例に倣い `ruby -ryaml`（ruby 不在は
// SKIPPED + grep 代替）で行い、YAML パーサ npm 依存を追加しない（NFR-02）。

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const supabaseRoot = path.join(repoRoot, "package-templates", "supabase");

const RULES_YAML = path.join(supabaseRoot, "semgrep", "authz-rules.yml");
const SUPABASE_README = path.join(supabaseRoot, "README.md");
const PROFILE_README = path.join(
  repoRoot,
  "package-templates",
  "profiles",
  "supabase-rls",
  "README.md",
);
const SECURITY_SCAN_PROMPT = path.join(
  repoRoot,
  "package-templates",
  "prompts",
  "security-scan.md",
);

// SPEC-0064 の契約から導出する固定期待値（AP-07: 実装ではなく仕様から）。
const EXPECTED_RULE_IDS = [
  "supabase-rls.service-role-client-misuse", // (a) service_role 誤用
  "supabase-rls.rls-query-without-owner-filter", // (b) 認可なし RLS クエリ
  "supabase-rls.route-handler-without-authz-guard", // (c) route handler ガードなし
];
const EXPECTED_RULE_COUNT = 3;
// SEC-01 / AC-01: Semgrep OSS の有効 severity 集合。HIGH / CRITICAL 等の
// AppSec Platform 表示分類は弾く。
const VALID_SEVERITIES = new Set(["ERROR", "WARNING", "INFO"]);
// AC-02: languages は TS/JS を含む（綴りゆれを許容）。
const TS_JS_LANGUAGES = new Set(["typescript", "javascript", "ts", "js"]);
// AC-01: いずれか 1 つを持てばよい pattern operator。
const PATTERN_OPERATORS = ["pattern", "patterns", "pattern-either", "pattern-regex"];

function read(file) {
  return fs.readFileSync(file, "utf8");
}

// ci-workflows.test.mjs と同じ手段（ruby -ryaml）で YAML をパースする。
// 外部 npm 依存を増やさない（NFR-02）。ruby 不在環境では SKIPPED 扱いにし、
// grep ベースの静的検証で代替継続する（AC-01 / NFR-04）。
let rubyAvailable = null;
function hasRuby() {
  if (rubyAvailable === null) {
    rubyAvailable = spawnSync("ruby", ["--version"], { encoding: "utf8" }).status === 0;
  }
  return rubyAvailable;
}

// ruby で authz-rules.yml をパースし、各ルールの id / severity / languages /
// message 有無 / 実在する pattern operator を JSON で書き出す。パース失敗
// （status != 0）は呼び出し側で assert する。
function rubyParseRules(t, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-semgrep-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const yamlPath = path.join(dir, "authz-rules.yml");
  fs.writeFileSync(yamlPath, content);
  const script = `
require "yaml"
require "json"
doc = YAML.load_file(ARGV[0])
rules = doc["rules"]
ops = ${JSON.stringify(PATTERN_OPERATORS)}
out = rules.map { |r|
  {
    "id" => r["id"],
    "severity" => r["severity"],
    "languages" => r["languages"],
    "hasMessage" => (r["message"].is_a?(String) && !r["message"].strip.empty?),
    "patternOps" => ops.select { |k| r.key?(k) },
  }
}
print JSON.generate({
  "topKeys" => doc.keys.map(&:to_s).sort,
  "rulesIsArray" => rules.is_a?(Array),
  "count" => rules.length,
  "rules" => out,
})
`;
  const result = spawnSync("ruby", ["-e", script, yamlPath], { encoding: "utf8" });
  return result;
}

// --- AC-01: YAML schema 妥当性（ruby パース版）------------------------------

test("AC-01: authz-rules.yml が存在し ruby -ryaml でパースでき rules がリストになる", (t) => {
  // FR-01 / INV-03: トップレベル `rules:` がリストで、パース可能な妥当 YAML である。
  // ruby 不在は ci-workflows.test.mjs 先例に倣い SKIPPED（grep 代替テストが担保）。
  assert.equal(fs.existsSync(RULES_YAML), true, "authz-rules.yml が存在しない");
  if (!hasRuby()) {
    t.skip("ruby not found (ci-workflows.test.mjs と同じく SKIPPED、grep 代替で担保)");
    return;
  }
  const result = rubyParseRules(t, read(RULES_YAML));
  assert.equal(result.status, 0, `authz-rules.yml failed to parse: ${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  assert.ok(parsed.topKeys.includes("rules"), "トップレベルに rules キーがない");
  assert.equal(parsed.rulesIsArray, true, "rules がリストでない");
});

test("AC-01: 各ルールに id / message / severity / languages / pattern operator が揃う（ruby パース）", (t) => {
  // FR-01 / NFR-01: 各ルールが 5 必須要素（id / message / severity / languages /
  // いずれかの pattern operator）を持つことをパース結果で検証する。
  if (!hasRuby()) {
    t.skip("ruby not found (SKIPPED、grep 代替で担保)");
    return;
  }
  const result = rubyParseRules(t, read(RULES_YAML));
  assert.equal(result.status, 0, `parse failed: ${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  for (const rule of parsed.rules) {
    assert.ok(
      typeof rule.id === "string" && rule.id.length > 0,
      `rule id が欠落: ${JSON.stringify(rule)}`,
    );
    assert.equal(rule.hasMessage, true, `${rule.id}: message が欠落`);
    assert.ok(
      typeof rule.severity === "string" && rule.severity.length > 0,
      `${rule.id}: severity が欠落`,
    );
    assert.ok(
      Array.isArray(rule.languages) && rule.languages.length > 0,
      `${rule.id}: languages が欠落`,
    );
    assert.ok(
      rule.patternOps.length >= 1,
      `${rule.id}: pattern operator が 1 つもない`,
    );
  }
});

test("AC-01: 各ルールの severity が Semgrep OSS 有効値 {ERROR, WARNING, INFO} のいずれかである（ruby パース）", (t) => {
  // AC-01 / SEC-01: 無効値 HIGH / CRITICAL / MEDIUM / LOW（AppSec Platform 表示分類）を弾く。
  if (!hasRuby()) {
    t.skip("ruby not found (SKIPPED、grep 代替で担保)");
    return;
  }
  const result = rubyParseRules(t, read(RULES_YAML));
  assert.equal(result.status, 0, `parse failed: ${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  for (const rule of parsed.rules) {
    assert.ok(
      VALID_SEVERITIES.has(rule.severity),
      `${rule.id}: severity "${rule.severity}" が {ERROR, WARNING, INFO} に含まれない`,
    );
  }
});

// --- AC-01（代替）: ruby 不在時の grep ベース schema 検証 --------------------

test("AC-01(grep代替): authz-rules.yml に rules: と id/message/severity/languages/pattern operator トークンが存在する", () => {
  // NFR-04 / 異常系1: ruby 不在で YAML パースが SKIPPED になっても、必須トークンの
  // 存在を grep で代替検証し、必須要素欠落の silent 配布を防ぐ。ruby の有無に依らず常に実行する。
  const source = read(RULES_YAML);

  assert.match(source, /^\s*rules:/m, "トップレベル rules: がない");
  assert.match(source, /^\s*-?\s*id:/m, "id: トークンがない");
  assert.match(source, /^\s*message:/m, "message: トークンがない");
  assert.match(source, /^\s*severity:/m, "severity: トークンがない");
  assert.match(source, /^\s*languages:/m, "languages: トークンがない");

  const patternOperatorToken = new RegExp(
    `^\\s*-?\\s*(?:${PATTERN_OPERATORS.join("|")}):`,
    "m",
  );
  assert.match(source, patternOperatorToken, "pattern operator トークンがない");
});

test("AC-01(grep代替): severity: の値がすべて {ERROR, WARNING, INFO} のいずれかである", () => {
  // AC-01 / SEC-01: grep 経路でも無効な severity 値（HIGH / CRITICAL 等）を弾く。
  const source = read(RULES_YAML);
  const severityValues = [...source.matchAll(/^\s*severity:\s*(\S+)\s*$/gm)].map(
    (m) => m[1],
  );

  assert.equal(
    severityValues.length,
    EXPECTED_RULE_COUNT,
    `severity: 行が ${EXPECTED_RULE_COUNT} 件でない（${severityValues.length} 件）`,
  );
  for (const value of severityValues) {
    assert.ok(
      VALID_SEVERITIES.has(value),
      `severity "${value}" が {ERROR, WARNING, INFO} に含まれない`,
    );
  }
});

// --- AC-02: ルール meta の健全性 --------------------------------------------

test("AC-02: ルールが 3 件存在し id が一意で 3 意図（service_role / owner filter / route handler）の id が揃う（ruby パース）", (t) => {
  // FR-01 / FR-02: 件数 3・id 一意・namespace 付き・3 意図の id 集合を検証する。
  if (!hasRuby()) {
    t.skip("ruby not found (SKIPPED、grep 代替で担保)");
    return;
  }
  const result = rubyParseRules(t, read(RULES_YAML));
  assert.equal(result.status, 0, `parse failed: ${result.stderr}`);
  const parsed = JSON.parse(result.stdout);

  assert.equal(parsed.count, EXPECTED_RULE_COUNT, "ルール件数が 3 でない");

  const ids = parsed.rules.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, `id に重複がある: ${ids.join(", ")}`);
  for (const id of ids) {
    assert.match(id, /^supabase-rls\./, `id "${id}" が namespace 付きでない`);
  }
  assert.deepEqual(
    [...ids].sort(),
    [...EXPECTED_RULE_IDS].sort(),
    "3 意図の id 集合が期待と一致しない",
  );
});

test("AC-02: 各ルールの languages が TS/JS を含む（ruby パース）", (t) => {
  // FR-01 / 境界ケース1: languages が typescript / javascript / ts / js のいずれかを含む。
  if (!hasRuby()) {
    t.skip("ruby not found (SKIPPED、grep 代替で担保)");
    return;
  }
  const result = rubyParseRules(t, read(RULES_YAML));
  assert.equal(result.status, 0, `parse failed: ${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  for (const rule of parsed.rules) {
    const hasTsJs = rule.languages.some((lang) => TS_JS_LANGUAGES.has(lang));
    assert.ok(
      hasTsJs,
      `${rule.id}: languages ${JSON.stringify(rule.languages)} に TS/JS がない`,
    );
  }
});

test("AC-02(grep代替): 3 意図の id が YAML 内に出現する", () => {
  // NFR-04: ruby 不在でも 3 意図の id 存在を grep で担保する。
  const source = read(RULES_YAML);
  for (const id of EXPECTED_RULE_IDS) {
    assert.ok(source.includes(id), `id "${id}" が YAML に出現しない`);
  }
  // id: 行の件数も 3 件で固定する（重複・過不足の検出）。
  const idLines = [...source.matchAll(/^\s*-?\s*id:\s*(\S+)\s*$/gm)].map((m) => m[1]);
  assert.equal(idLines.length, EXPECTED_RULE_COUNT, "id: 行が 3 件でない");
  assert.equal(new Set(idLines).size, idLines.length, "id: 行に重複がある");
});

test("AC-02(grep代替): languages に TS/JS の綴りが出現する", () => {
  // NFR-04 / 境界ケース1: ruby 不在でも languages の TS/JS を grep で担保する。
  const source = read(RULES_YAML);
  assert.match(source, /languages:\s*\[[^\]]*typescript[^\]]*\]/, "typescript が languages にない");
  assert.match(source, /languages:\s*\[[^\]]*javascript[^\]]*\]/, "javascript が languages にない");
});

// --- AC-03: 誤検知配慮のコメント併記 -----------------------------------------

test("AC-03: YAML に「例 / 出発点（starting point / example / not exhaustive）」の但し書きがある", () => {
  // FR-03 / SEC-01 / リスク5: 網羅的 authz チェックと誤解させないための但し書き。
  const source = read(RULES_YAML);
  assert.match(
    source,
    /starting point|starting-point|example|not exhaustive|出発点/i,
    "「例 / 出発点」の但し書きがない",
  );
});

test("AC-03: YAML に nosemgrep による行単位抑制方法が記載されている", () => {
  // FR-03 / 異常系2: `// nosemgrep: <rule-id>` での抑制手段を明記する。
  const source = read(RULES_YAML);
  assert.match(source, /nosemgrep/, "nosemgrep 抑制方法の記載がない");
});

test("AC-03: YAML に paths: / pattern-not によるチューニング前提が記載されている", () => {
  // FR-03 / SEC-01: 誤検知を利用者が絞り込むためのチューニング前提を明記する。
  const source = read(RULES_YAML);
  assert.match(source, /paths:/, "paths: チューニング前提の記載がない");
  assert.match(source, /pattern-not/, "pattern-not チューニング前提の記載がない");
});

test("AC-03: 各ルール id ごとに nosemgrep: <その id> の抑制例が併記されている", () => {
  // FR-03: `nosemgrep: <id>` で参照する命名になっており、各ルールに抑制例がある。
  const source = read(RULES_YAML);
  for (const id of EXPECTED_RULE_IDS) {
    assert.ok(
      source.includes(`nosemgrep: ${id}`),
      `id "${id}" の nosemgrep 抑制例が併記されていない`,
    );
  }
});

test("AC-03: YAML に service_role の実値 / 本番 URL を混入させず env 名のみを参照している", () => {
  // SEC-02 / SEC-03: pattern が参照する env 名（SUPABASE_SERVICE_ROLE_KEY 等）は
  // 名前のみで、実 secret / 本番 URL / 本番 email を例示しない。
  const source = read(RULES_YAML);
  // service_role をアンチパターンとして「検出する側」の記述はあってよい（env 名参照）。
  assert.match(source, /SERVICE_ROLE/i, "service_role 検出のための env 名参照がない");
  // secret / 本番値の実体を混入させない。
  assert.doesNotMatch(source, /https?:\/\/[a-z0-9-]+\.supabase\.co/i, "本番 Supabase URL が混入している");
  assert.doesNotMatch(source, /eyJ[A-Za-z0-9_-]{20,}/, "JWT 様の secret 実値が混入している");
});

// --- AC-04: supabase/README.md の opt-in 適用手順 ---------------------------

test("AC-04: supabase/README.md に opt-in 適用手順の 5 要素が共存している", () => {
  // FR-04 / SEC-02: (1)config auto 不変 / (2)--config 追加コマンド / (3)例（出発点）で
  // 誤検知しうる / (4)nosemgrep 抑制 / (5)security-scan.md triage 導線 が README に揃う。
  const source = read(SUPABASE_README);

  // (1) security:sast = semgrep scan --config auto が変わらない旨
  assert.match(source, /config auto/, "config auto 不変の記載がない");
  // (2) --config を追加する適用コマンド + authz-rules.yml パス
  assert.match(source, /--config/, "--config 追加手順がない");
  assert.match(
    source,
    /--config\s+\.\/supabase\/semgrep\/authz-rules\.yml/,
    "authz-rules.yml を --config 追加する適用コマンド例がない",
  );
  assert.match(source, /authz-rules\.yml/, "authz-rules.yml パスの記載がない");
  // (3) 例（出発点）で誤検知しうる旨
  assert.match(
    source,
    /starting point|example|not exhaustive|false positive/i,
    "「例（出発点）で誤検知しうる」旨の記載がない",
  );
  // (4) nosemgrep 抑制
  assert.match(source, /nosemgrep/, "nosemgrep 抑制方法の記載がない");
  // (5) security-scan.md triage 導線
  assert.match(source, /security-scan/, "security-scan.md triage 導線がない");
});

test("AC-04: supabase/README.md の service_role 非使用注意書きが維持されている", () => {
  // SEC-02 / 既存実装との衝突点: 既存の「service_role を RLS 検証に使わない」注意書きを
  // 削除・弱体化していない（Semgrep 節の追加が既存注意書きと整合する）。
  const source = read(SUPABASE_README);
  assert.match(
    source,
    /Do not use `?service_role`?/,
    "service_role 非使用の既存注意書きが失われている",
  );
});

// --- AC-05: profile README / security-scan prompt の導線追記 ----------------

test("AC-05: profiles/supabase-rls/README.md に authz-rules.yml 同梱 + opt-in（--config 追加）要約がある", () => {
  // FR-05: profile README に addon がルールを同梱し --config 追加で opt-in 適用する旨を追記。
  const source = read(PROFILE_README);
  assert.match(source, /authz-rules\.yml/, "profile README に authz-rules.yml の記載がない");
  assert.match(source, /--config/, "profile README に --config 追加の要約がない");
  assert.match(source, /config auto/, "profile README に既定 config auto 不変の記載がない");
});

test("AC-05: security-scan.md に authz-rules.yml 追加適用出力も triage 対象である旨がある", () => {
  // FR-05: security-scan prompt に authz-rules.yml 出力も triage 対象であり、
  // ルールは出発点で誤検知しうる前提の記載を追記。
  const source = read(SECURITY_SCAN_PROMPT);
  assert.match(source, /authz-rules\.yml/, "security-scan.md に authz-rules.yml の記載がない");
  assert.match(source, /--config/, "security-scan.md に --config 追加適用の記載がない");
  assert.match(
    source,
    /starting.point|example|false positive/i,
    "「出発点 / 誤検知しうる」前提の記載がない",
  );
});

test("AC-05: security-scan.md の既存 triage 5 分類が無変更で残っている", () => {
  // FR-05 / 契約(5): 既存 triage 分類ロジック（fix now / false positive /
  // suppress with owner and expiration / accept risk with explicit business
  // justification / needs human security review）を変えていない。
  const source = read(SECURITY_SCAN_PROMPT);
  const classifications = [
    "fix now",
    "false positive",
    "suppress with owner and expiration",
    "accept risk with explicit business justification",
    "needs human security review",
  ];
  for (const cls of classifications) {
    assert.ok(source.includes(cls), `triage 分類 "${cls}" が失われている`);
  }
});

// --- FR-06 / INV-02: 既定挙動の非変更（opt-in の完全性）----------------------

test("FR-06: security:sast = semgrep scan --config auto が package script 側で無変更である", () => {
  // FR-06 / INV-01 / INV-02: ルール追加は opt-in であり、既定 gate（security:sast）を
  // 変えない。package.scripts.fragment.json / profile-scripts.mjs の当該行が保たれる。
  const fragment = JSON.parse(
    read(path.join(repoRoot, "package-templates", "package.scripts.fragment.json")),
  );
  assert.equal(
    fragment.scripts["security:sast"],
    "semgrep scan --config auto",
    "fragment.json の security:sast が変更されている",
  );

  const profileScriptsSource = read(
    path.join(repoRoot, "src", "cli", "profile-scripts.mjs"),
  );
  assert.match(
    profileScriptsSource,
    /"security:sast":\s*"semgrep scan --config auto"/,
    "profile-scripts.mjs の security:sast が変更されている",
  );
});

test("FR-06 / INV-06: src/cli/ に authz-rules.yml / supabase/semgrep を読み込む管理コードが無い", () => {
  // INV-06 / ASM-03: ルール YAML は manual-copy 配布物であり、CLI（init/update/doctor）の
  // managed file 経路の対象外。src/cli/ 配下に本ルール YAML を参照するコードパスが無いことを
  // 静的に確認する（`grep -rn "authz-rules|supabase/semgrep" src/cli/` 相当）。
  const cliDir = path.join(repoRoot, "src", "cli");
  const files = fs
    .readdirSync(cliDir, { recursive: true })
    .filter((entry) => typeof entry === "string" && entry.endsWith(".mjs"));
  for (const rel of files) {
    const source = read(path.join(cliDir, rel));
    assert.doesNotMatch(
      source,
      /authz-rules|supabase\/semgrep/,
      `src/cli/${rel} が authz-rules.yml / supabase/semgrep を参照している（CLI 管理化はスコープ外）`,
    );
  }
});
