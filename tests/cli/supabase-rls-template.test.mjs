import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// SPEC-0063: supabase-rls addon の RLS テストテンプレをスキーマ非依存に
// パラメータ化したことの静的検証（NFR-01: 本リポ CI は実 Postgres / Supabase /
// ブラウザを起動しないため、observable はテンプレファイルの内容に限る）。
// 期待値は SPEC-0063 の契約節・AC-01〜AC-06・NFR-04 から導出する（AP-07）。
// 依存追加ゼロ = Node 標準（node:test / node:assert / node:fs）のみ（NFR-02）。

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const templatesRoot = path.join(repoRoot, "package-templates", "supabase");

const SQL_TEMPLATE = path.join(templatesRoot, "tests", "database", "rls_policy.test.sql");
const TS_TEMPLATE = path.join(templatesRoot, "tests", "rls", "rls.integration.test.ts");
const E2E_TEMPLATE = path.join(templatesRoot, "tests", "e2e", "magic-link.spec.ts");
const SUPABASE_README = path.join(templatesRoot, "README.md");
const PROFILE_README = path.join(
  repoRoot,
  "package-templates",
  "profiles",
  "supabase-rls",
  "README.md",
);
const RLS_PROMPT = path.join(repoRoot, "package-templates", "prompts", "rls-permission.md");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

// 設定変数ブロックの「宣言行」を本文から除外するためのフィルタ。
// SQL: psql の宣言は行頭 `\set`。TS: 宣言は `const ... = process.env`。
// 直書きハードコード検出は、この宣言行を除いた本文に対して行う（AC-01 / AC-02 の
// 一次情報源が定める除外方針）。
function sqlBodyLines(source) {
  return source
    .split("\n")
    .filter((line) => !/^\s*\\set\b/.test(line));
}

function tsBodyLines(source) {
  return source
    .split("\n")
    .filter((line) => !/const\s+\w+\s*=\s*process\.env/.test(line));
}

// --- AC-01: SQL 変数集約（rls_policy.test.sql） ---

test("AC-01: rls_policy.test.sql の冒頭に \\set table_name / \\set owner_column の設定変数ブロックが存在する", () => {
  // FR-01: スキーマ依存値をファイル冒頭の設定変数ブロック 1 箇所に psql 変数で宣言する
  const source = read(SQL_TEMPLATE);

  assert.match(source, /^\s*\\set\s+table_name\s+app_items\s*$/m);
  assert.match(source, /^\s*\\set\s+owner_column\s+owner_id\s*$/m);
});

test("AC-01: \\set 宣言行を除いた本文に app_items / owner_id のリテラル直書きが存在しない", () => {
  // FR-01 / 異常系3 / リスク3: 本文の 5+5 箇所を全て変数参照に置換し、置換漏れ 0 件を機械検出する。
  // default 宣言（\set 行）のみに app_items / owner_id リテラルが残る形が正しい。
  const body = sqlBodyLines(read(SQL_TEMPLATE)).join("\n");

  assert.doesNotMatch(body, /\bapp_items\b/, "本文に app_items のリテラル直書きが残っている");
  assert.doesNotMatch(body, /\bowner_id\b/, "本文に owner_id のリテラル直書きが残っている");
});

test("AC-01: 本文が format( + %I + :'table_name' / :'owner_column' の識別子注入形で参照している", () => {
  // FR-01 / SEC-01 / INV-04: 識別子注入は format('%I', :'var') イディオム。
  // :'var'（シングルクォート値展開）をドル引用符の外で format() に渡し、%I が
  // 安全な識別子に変換する（AC-01 は format( / %I / :'table_name' / :'owner_column' の共存を要求）。
  const source = read(SQL_TEMPLATE);

  assert.match(source, /format\(/, "format( が本文に存在しない");
  assert.match(source, /%I/, "%I 識別子プレースホルダが本文に存在しない");
  assert.match(source, /:'table_name'/, ":'table_name' の値展開参照が存在しない");
  assert.match(source, /:'owner_column'/, ":'owner_column' の値展開参照が存在しない");
});

test("AC-01: 識別子注入はシングルクォート :'var' 形で、ドル引用符内に :\"var\" ダブルクォート形が現れない", () => {
  // SEC-01 / INV-04 / 異常系2: psql の変数展開はドル引用符 $$...$$ / $q$...$q$ 内では
  // 機能しない。ドル引用符内に生の変数参照（:"var" / :'var'）を置くと展開されず
  // リテラル文字列としてサーバに渡り無効な SQL になる。正しい形は :'var' を
  // ドル引用符の外（format() 引数）で渡すこと。ここでは誤り形 :"table_name" /
  // :"owner_column" がテンプレ全体に存在しないことを固定する。
  const source = read(SQL_TEMPLATE);

  assert.doesNotMatch(
    source,
    /:"table_name"/,
    ':"table_name"（ダブルクォート）はドル引用符内展開の誤り形（SEC-01）',
  );
  assert.doesNotMatch(
    source,
    /:"owner_column"/,
    ':"owner_column"（ダブルクォート）はドル引用符内展開の誤り形（SEC-01）',
  );
});

// --- AC-02: TS 変数集約（rls.integration.test.ts） ---

test("AC-02: rls.integration.test.ts の冒頭に const TABLE / const OWNER の変数宣言ブロックが存在する", () => {
  // FR-03: テーブル名・所有者列名を const + process.env fallback 形で集約する
  const source = read(TS_TEMPLATE);

  assert.match(source, /const\s+TABLE\s*=\s*process\.env\.RLS_TABLE\s*\?\?\s*"app_items"/);
  assert.match(source, /const\s+OWNER\s*=\s*process\.env\.RLS_OWNER_COLUMN\s*\?\?\s*"owner_id"/);
});

test("AC-02: const ... = process.env の宣言行を除いた本文に app_items / owner_id 直書きが存在しない", () => {
  // FR-03 / 異常系3 / リスク3: 本文の .from / .select / .eq 計 8 箇所を変数参照に置換し、
  // default 宣言行のみに app_items / owner_id リテラルが残る形が正しい。
  const body = tsBodyLines(read(TS_TEMPLATE)).join("\n");

  assert.doesNotMatch(body, /\bapp_items\b/, "本文に app_items のリテラル直書きが残っている");
  assert.doesNotMatch(body, /\bowner_id\b/, "本文に owner_id のリテラル直書きが残っている");
});

test("AC-02: 本文が TABLE / OWNER 変数を .from / .select / .eq で参照している", () => {
  // FR-03: .from(TABLE) / .select(`id, ${OWNER}`) / .eq(OWNER, ...) の変数参照が存在する
  const source = read(TS_TEMPLATE);

  assert.match(source, /\.from\(TABLE\)/, ".from(TABLE) 参照が存在しない");
  assert.match(source, /\$\{OWNER\}/, ".select 内の ${OWNER} 参照が存在しない");
  assert.match(source, /\.eq\(OWNER,/, ".eq(OWNER, ...) 参照が存在しない");
});

test("AC-02: 接続情報の既存 requireEnv 集約が維持されている", () => {
  // FR-03: URL / anon key / session / user id の requireEnv 集約は変えない
  const source = read(TS_TEMPLATE);

  assert.match(source, /requireEnv\("SUPABASE_URL"\)/);
  assert.match(source, /requireEnv\("SUPABASE_ANON_KEY"\)/);
});

// --- AC-03: env fallback（SQL の -v 上書き / TS の process.env 上書き） ---

test("AC-03: TS 変数解決が env 未設定で default（app_items / owner_id）を返す", () => {
  // FR-04 / 異常系1: process.env.RLS_TABLE 未設定で ?? の右辺 default が有効。
  // テンプレと同型の解決ロジックを再現し、env 有無で切り替わることを単体検証する。
  const resolveTable = (env) => env.RLS_TABLE ?? "app_items";
  const resolveOwner = (env) => env.RLS_OWNER_COLUMN ?? "owner_id";

  assert.equal(resolveTable({}), "app_items");
  assert.equal(resolveOwner({}), "owner_id");
});

test("AC-03: TS 変数解決が env 設定時にその値へ切り替わる", () => {
  // FR-04: process.env.RLS_TABLE / RLS_OWNER_COLUMN 設定時は override 値を使う
  const resolveTable = (env) => env.RLS_TABLE ?? "app_items";
  const resolveOwner = (env) => env.RLS_OWNER_COLUMN ?? "owner_id";

  assert.equal(resolveTable({ RLS_TABLE: "orders" }), "orders");
  assert.equal(resolveOwner({ RLS_OWNER_COLUMN: "user_id" }), "user_id");
});

test("AC-03: TS テンプレが process.env fallback の default にリテラルと同じ app_items / owner_id を保持する", () => {
  // FR-02 / FR-04 / INV-02: default 値は現行リテラルと一致し、env 無指定時の
  // 挙動を現行と同一にする（後方互換）。宣言ブロック内の default を直接確認する。
  const source = read(TS_TEMPLATE);
  const declLines = source
    .split("\n")
    .filter((line) => /const\s+\w+\s*=\s*process\.env/.test(line))
    .join("\n");

  assert.match(declLines, /\?\?\s*"app_items"/);
  assert.match(declLines, /\?\?\s*"owner_id"/);
});

test("AC-03: SQL テンプレが -v 上書きの仕組みを宣言・コメントで示している", () => {
  // FR-02: psql -v table_name=<name> で default を上書きできることをテンプレが示す。
  // \set default が env/-v 無指定時に有効（無指定時は冒頭 \set の default）。
  const source = read(SQL_TEMPLATE);

  assert.match(source, /psql\s+-v\s+table_name/, "psql -v table_name の注入方法がコメントに無い");
  assert.match(source, /^\s*\\set\s+table_name\s+app_items\s*$/m, "-v 無指定時の \\set default が無い");
});

// --- AC-04: SQL / TS テンプレの静的妥当性（NFR-03 検証意図の保存） ---

test("AC-04: rls_policy.test.sql が plan(6) と必須トークンを保持している", () => {
  // NFR-03 / INV-03: plan() 件数・pgTAP 構造・finish() を保存する。
  // 実 DB 接続なし（NFR-01）で必須トークン存在の静的健全性を確認する。
  const source = read(SQL_TEMPLATE);

  assert.match(source, /select\s+plan\(6\)/, "plan(6) が保存されていない");
  assert.match(source, /format\('%I'/, "format('%I' の識別子化イディオムが無い");
  assert.match(source, /select\s+\*\s+from\s+finish\(\)/, "select * from finish() が無い");
  assert.match(source, /create\s+extension\s+if\s+not\s+exists\s+pgtap/, "pgtap 拡張宣言が無い");
});

test("AC-04: rls_policy.test.sql の 6 アサーションが許可/拒否の意味ごとに保存されている", () => {
  // NFR-03 / INV-03: 許可（lives_ok / isnt_empty）と拒否（is_empty / results_eq /
  // throws_ok）の各アサーションが保存され、plan(6) 件数と対応する。
  const source = read(SQL_TEMPLATE);
  const assertions = ["lives_ok", "isnt_empty", "is_empty", "results_eq", "throws_ok"];

  for (const fn of assertions) {
    assert.match(source, new RegExp(`select\\s+${fn}\\(`), `${fn}( アサーションが保存されていない`);
  }
  // lives_ok は 2 回（claims set + update own）現れる = 計 6 アサーション
  const livesOkCount = (source.match(/select\s+lives_ok\(/g) ?? []).length;
  assert.equal(livesOkCount, 2, "lives_ok が 2 箇所（claims / update own）保存されていない");
});

test("AC-04: rls_policy.test.sql の UUID 集約（set_config）が維持されている", () => {
  // 既存実装との衝突点: UUID は既にパラメータ化済みで二重管理にしない。
  // SEC-03: UUID は非機密ダミー（0000...0001 / ...0002）を維持する。
  const source = read(SQL_TEMPLATE);

  assert.match(source, /set_config\('app\.test_user_a',\s*'00000000-0000-0000-0000-000000000001'/);
  assert.match(source, /set_config\('app\.test_user_b',\s*'00000000-0000-0000-0000-000000000002'/);
});

test("AC-04: rls.integration.test.ts の describe/test 構造と service-role warning が保存されている", () => {
  // NFR-03 / INV-03 / SEC-02 / INV-05 / 異常系4: describe/test 構造、
  // anon key + user session 経路、service-role bypass warning コメントを保存する。
  const source = read(TS_TEMPLATE);

  assert.match(source, /describe\("RLS integration"/, "describe 構造が保存されていない");
  const testCount = (source.match(/\btest\(/g) ?? []).length;
  assert.equal(testCount, 2, "test ブロックが 2 件保存されていない");
  assert.match(source, /service-role bypass warning/, "service-role bypass warning コメントが無い");
  assert.doesNotMatch(source, /service_role/, "service_role を使う経路・例示が混入している（SEC-02）");
});

test("AC-04: 各 TS テンプレが構造健全（import / const / ?? を保持）である", () => {
  // NFR-02: tsc 非依存の文字列読取で TS の構造健全性を確認する。
  // magic-link.spec.ts を含む TS 系テンプレがパース健全な骨格を保持する。
  const integration = read(TS_TEMPLATE);
  const e2e = read(E2E_TEMPLATE);

  for (const [label, source] of [["integration", integration], ["e2e", e2e]]) {
    assert.match(source, /^import\s/m, `${label}: import 文が無い`);
    assert.match(source, /const\s+\w+\s*=/, `${label}: const 宣言が無い`);
  }
  // e2e は env fallback の ?? を保持（見出し整合後も default 値・フロー不変 = FR-05）
  assert.match(e2e, /process\.env\.SUPABASE_TEST_EMAIL\s*\?\?\s*"user@example\.test"/);
  assert.match(e2e, /process\.env\.SUPABASE_LOCAL_MAIL_API_URL\s*\?\?/);
});

test("AC-04: magic-link.spec.ts が設定変数ブロック見出しと非機密 default を保持している", () => {
  // FR-05 / SEC-03: 既存 env 変数を設定変数ブロック見出しに整合。
  // URL は 127.0.0.1 ローカル、email は .test ドメインの非機密 default を維持する。
  const source = read(E2E_TEMPLATE);

  assert.match(source, /設定変数/, "設定変数ブロック見出しが無い（FR-05 見出し整合）");
  assert.match(source, /127\.0\.0\.1/, "ローカル URL default（127.0.0.1）が無い");
  assert.match(source, /user@example\.test/, ".test ドメインの test email default が無い");
});

// --- 境界ケース1: tenant 列を使わないスキーマ（tenant 変数を必須にしない） ---

test("境界ケース1: SQL テンプレは tenant 変数を必須にせず default で有効な形を保つ", () => {
  // 境界ケース1 / AC-04: tenant_id を持たないスキーマでも default（tenant 非依存）の
  // テストが有効な SQL として成立する。tenant 列は optional である旨を示す。
  const source = read(SQL_TEMPLATE);
  const requiredSets = source.match(/^\s*\\set\s+\w+/gm) ?? [];

  // 必須の \set は table_name / owner_column の 2 件。tenant_column は必須宣言に含まない。
  assert.doesNotMatch(
    source,
    /^\s*\\set\s+tenant_column\b/m,
    "tenant_column が必須の \\set 宣言として存在する（optional であるべき）",
  );
  assert.ok(requiredSets.length >= 2, "table_name / owner_column の \\set 宣言が揃っていない");
});

// --- AC-05: supabase/README.md の Replacement Checklist 簡素化 ---

test("AC-05: supabase/README.md の Checklist が設定変数ブロック 1 箇所編集 / env 注入形に簡素化されている", () => {
  // FR-06: 「find-replace 複数箇所」から「設定変数ブロック 1 箇所編集 / env 注入」へ。
  const source = read(SUPABASE_README);

  assert.match(source, /設定変数|"設定変数"/, "設定変数ブロックへの言及が無い");
  assert.match(source, /Edit that one block|1 箇所|single/i, "1 箇所編集の記載が無い");
});

test("AC-05: supabase/README.md に SQL / TS / Playwright の変数名一覧と 2 注入方法が記載されている", () => {
  // FR-06: SQL（\set / -v）・TS（const / RLS_TABLE env）・Playwright（env）の
  // 変数名一覧と、編集/注入の 2 方法（設定変数ブロック編集 / env 注入）を記載する。
  const source = read(SUPABASE_README);

  // 変数名一覧: SQL psql 変数・TS const・env var
  assert.match(source, /\\set\s+table_name/, "SQL 変数 \\set table_name の記載が無い");
  assert.match(source, /const\s+TABLE/, "TS 変数 const TABLE の記載が無い");
  assert.match(source, /RLS_TABLE/, "TS env var RLS_TABLE の記載が無い");
  assert.match(source, /SUPABASE_TEST_EMAIL/, "Playwright env var の記載が無い");
  // 注入方法: (1) 設定変数ブロック編集 (2) env 注入（SQL は psql -v、TS/Playwright は env var 前置）
  assert.match(source, /psql\s+-v\s+table_name/, "psql -v 注入方法の記載が無い");
  assert.match(source, /RLS_TABLE=\w+\s+vitest|RLS_TABLE=/, "TS env var 注入方法の記載が無い");
});

test("AC-05: supabase/README.md に service_role 非使用の注意書きが残存している", () => {
  // SEC-02 / 異常系4: service_role を RLS correctness テストで使わない注意書きを維持する。
  const source = read(SUPABASE_README);

  assert.match(source, /service_role/, "service_role の注意書きが削除されている（SEC-02）");
  assert.match(source, /Do not use `service_role`|bypass/i, "service_role 非使用の趣旨が残っていない");
});

test("AC-05: supabase/README.md に manual-copy 非追従性の告知がある", () => {
  // FR-08 / INV-06 / 境界ケース2 / POST-02: 既存コピーは update で新形式が降ってこない。
  const source = read(SUPABASE_README);

  assert.match(source, /Manual-copy|manual-copy/, "manual-copy の言及が無い");
  assert.match(
    source,
    /does \*\*not\*\* flow|already made|next fresh copy|Re-copy/i,
    "既存コピーが自動追従しない旨の記載が無い（FR-08）",
  );
});

test("AC-05: supabase/README.md が SQL 識別子注入に :'var'（シングルクォート）を明記している", () => {
  // SEC-01: :'var'（値展開）を format('%I', ...) に渡す正しい形を README に明記する。
  // ドル引用符内では psql 変数展開が機能しない旨も示す。
  const source = read(SUPABASE_README);

  assert.match(source, /:'var'|:'table_name'/, ":'var' シングルクォートの記載が無い");
  assert.match(source, /%I/, "format %I 識別子プレースホルダの記載が無い");
  assert.match(source, /dollar-quoted|\$\$/, "ドル引用符内で展開されない旨の記載が無い");
});

// --- AC-06: profile / prompt のマッピングガイド追記 ---

test("AC-06: profiles/supabase-rls/README.md にマトリクス → テスト設定変数の対応ガイドが存在する", () => {
  // FR-07: 権限マトリクス（role/resource/action）をテスト設定変数へ対応づける手順。
  const source = read(PROFILE_README);

  assert.match(source, /設定変数/, "設定変数への言及が無い");
  assert.match(source, /マトリクス/, "マトリクスへの言及が無い");
  assert.match(source, /table_name|RLS_TABLE/, "テスト変数（table_name / RLS_TABLE）への対応づけが無い");
  assert.match(source, /rls-permission\.md/, "rls-permission.md への参照が無い");
});

test("AC-06: prompts/rls-permission.md の「カスタマイズ」節にマッピングガイドが追記されている", () => {
  // FR-07 / 契約(4): 追記はガイド節のみ。マトリクス生成プロンプト本体（Step 1〜3）は不変。
  const source = read(RLS_PROMPT);

  assert.match(source, /## カスタマイズ/, "カスタマイズ節が無い");
  assert.match(source, /設定変数/, "設定変数への言及が無い");
  assert.match(source, /table_name|RLS_TABLE/, "テスト設定変数への対応づけが無い");
});

test("AC-06: prompts/rls-permission.md のマトリクス生成プロンプト本体（手順 / 出力形式）が保存されている", () => {
  // FR-07 / 契約(4): 「## 手順」Step 1〜6 と「## 出力形式」の Step 1〜3 は不変。
  // マトリクス生成ロジックの見出し・骨格が残っていることを固定する。
  const source = read(RLS_PROMPT);

  assert.match(source, /## 手順/, "## 手順 の見出しが無い（プロンプト本体が壊れている）");
  assert.match(source, /## 出力形式/, "## 出力形式 の見出しが無い");
  assert.match(source, /### Step 1: 権限マトリクス/, "Step 1 権限マトリクスが無い");
  assert.match(source, /### Step 2: 拒否ケースのテスト/, "Step 2 拒否ケースが無い");
  assert.match(source, /### Step 3: 許可ケースのテスト/, "Step 3 許可ケースが無い");
});
