# PLAN-0063: supabase-rls RLS テストテンプレのスキーマ非依存パラメータ化の実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0063 |
| SPEC-ID   | [SPEC-0063](../specs/SPEC-0063-rls-parameterized.md) |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [x] infrastructure（配布物 = manual-copy テンプレ 3 ファイルの内容変更。`package-templates/supabase/tests/{database/rls_policy.test.sql, rls/rls.integration.test.ts, e2e/magic-link.spec.ts}` を「冒頭設定変数ブロック + 本文の変数参照」形にパラメータ化する。**active な検証意図（`plan(6)` 件数・許可/拒否アサーション・`describe`/`test` 構造）は不変** = NFR-03 / INV-03。`src/cli/` は一切変更しない = INV-06 / スコープ外節）
- [ ] frontend
- [ ] infra
- [x] test（`tests/cli/supabase-rls-template.test.mjs` を**新規**作成。`tests/cli/` 配下のため現行 `package.json` の `test` = `node --test tests/cli/*.test.mjs` に自動で含まれ package.json 変更不要。変数集約 grep + env fallback + SQL/TS 静的妥当性を集約する）
- [x] docs（`package-templates/supabase/README.md` の Replacement Checklist 簡素化、`package-templates/profiles/supabase-rls/README.md` / `package-templates/prompts/rls-permission.md` のマトリクス → テスト変数マッピングガイド追記）

## 影響範囲

| 機能/モジュール | 影響内容 |
|---|---|
| `package-templates/supabase/tests/database/rls_policy.test.sql` | 冒頭（既存の `set_config('app.test_user_a', ...)` 集約近傍）に設定変数ブロック `\set table_name app_items` / `\set owner_column owner_id` を追加。本文 5 箇所の `app_items`（L25/34/42/51/62）を `:"table_name"`、本文 5 箇所の `owner_id`（L26/35/44/53/62）を `:"owner_column"` の識別子展開に置換する（**`:"var"` ダブルクォート展開 = SEC-01 / INV-04**、`:'var'` リテラル展開は使わない）。L11 の注記コメントは変数ブロックの説明に更新。既存 UUID 集約（`set_config`）・`plan(6)` は不変（FR-01 / FR-02 / SEC-01 / INV-03） |
| `package-templates/supabase/tests/rls/rls.integration.test.ts` | import 群直後・`describe` 前に変数宣言ブロック `const TABLE = process.env.RLS_TABLE ?? "app_items";` / `const OWNER = process.env.RLS_OWNER_COLUMN ?? "owner_id";` を追加。本文 3 箇所の `.from("app_items")`（L12/20/32）を `.from(TABLE)`、`.select("id, owner_id")`（L13/21）を `.select(\`id, ${OWNER}\`)`、`.eq("owner_id", ...)`（L14/22/34）を `.eq(OWNER, ...)` に置換する。`createUserClient` / `requireEnv` / 「service-role bypass warning」コメント（L45-47）は不変（FR-03 / FR-04 / SEC-02 / INV-05） |
| `package-templates/supabase/tests/e2e/magic-link.spec.ts` | 既存 `const mailApiUrl = process.env.SUPABASE_LOCAL_MAIL_API_URL ?? ...`（L3）/ `const testEmail = process.env.SUPABASE_TEST_EMAIL ?? ...`（L4）を、SQL/TS と同一の見出しコメント（例: `// --- 設定変数（環境に合わせて編集 / env で注入）---`）でまとめる。**default 値・fetch・locator・フロー本体は不変（機能変更なし）**（FR-05） |
| `package-templates/supabase/README.md` | 「Replacement Checklist」（L56-71）を「各ファイル冒頭の設定変数ブロックを 1 箇所編集、または env var を注入」へ書き換える。SQL（`\set` default / `psql -v`）・TS（`const` default / `process.env`）・Playwright（`process.env`）の変数名一覧 + 2 つの注入方法を記載。`service_role` 非使用の段落（L70-71）は維持。manual-copy ゆえ既存コピーは自動追従しない旨を 1 文追記（英語ベースの既存ドキュメントのため英語で追記 = 言語規約）（FR-06 / FR-08 / SEC-02 / SEC-03） |
| `package-templates/profiles/supabase-rls/README.md` | 「Manual-copy templates」節（L71-80）末尾に、テンプレが変数集約形であること + `rls-permission.md` の権限マトリクス（role/resource/action）をテスト設定変数（テーブル・所有者列・ロール名・ポリシー名）へ対応づける手順を追記（日本語ドキュメントのため日本語 = 言語規約）（FR-07） |
| `package-templates/prompts/rls-permission.md` | 「カスタマイズ」節（L85-89）に、生成マトリクスを pgTAP / integration テストの設定変数へ落とし込むマッピングガイドを追記（日本語で追記）。**プロンプト本文 Step 1〜3（マトリクス生成ロジック、L19-56）は不変**（FR-07 / INV は Gate 4 レビュー） |
| `tests/cli/supabase-rls-template.test.mjs`（新規） | (1) SQL テンプレの `\set` 宣言行を除いた本文に `/\bapp_items\b/` / `/\bowner_id\b/` がヒットしないこと + 冒頭に `\set table_name` / `:"table_name"` 参照が存在すること（AC-01）。(2) TS テンプレの宣言ブロックを除いた本文に同リテラルがヒットせず、`const TABLE = process.env.RLS_TABLE ?? "app_items"` 相当が存在すること（AC-02）。(3) env fallback: TS の `process.env.X ?? default` 解決を単体で（env 有無で）確認（AC-03）。(4) SQL/TS 静的妥当性: `plan(6)` トークン存在・許可/拒否アサーション保存・TS の必須トークン（`describe`/`test`）保存（AC-04） |

`src/cli/`（`managed-files.mjs` / `profile-docs.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs` — supabase テンプレを manual-copy のまま保つ）、`package-templates/package.scripts.fragment.json` / `src/cli/profile-scripts.mjs`（`security:sast` = `semgrep scan --config auto` を保存 — SPEC-0051）、他 profile の README、`docs/cli.md`（CLI surface 不変）、`package.json`（新規テストは `tests/cli/` glob 対象のため scripts 変更不要）は変更しない（SPEC File Scope / スコープ外節 / INV-05 / INV-06）。

> 補記（AC-01/AC-02 の grep 除外設計 = SPEC 実装メモの一次情報源化）: 変数集約の grep 検証は「宣言行を行頭パターンで除外して本文の直書きを 0 件確認する」設計が肝である。SQL は `^\s*\\set\b` で始まる行を除外し、残る本文に `\bapp_items\b` / `\bowner_id\b` がヒットしないことを検証する。TS は `const\s+\w+\s*=\s*process\.env` を含む宣言行を除外し、残る本文に同リテラルがヒットしないことを検証する。この除外方針は SPEC の AC-01 / AC-02 が一次情報源であり、テスト実装はそれに従う（実装メモではなく AC 側で確定済み）。

## 実装方針

1. **テンプレ確定 → テスト固定 → docs 化の直列**（SPEC 実装メモ「想定タスク分割と依存順序」T1→T2→T3 を踏襲）。SQL テンプレ（T1）を先に確定し、同時に新規 `tests/cli/supabase-rls-template.test.mjs` を作成して SQL 検証ケースを固定する。次に TS/E2E テンプレ（T2）を確定し、同一新規テストファイルに TS/env fallback ケースを**追記**する。最後に確定した変数名・注入方法を docs 化（T3）する。docs は確定挙動を文書化する（確定前の仕様を先に書かない）。
2. **T1 → T2 を直列にする根拠（同一新規テストファイルへの追記）**: T1 が新規作成する `tests/cli/supabase-rls-template.test.mjs` に、T2 が TS 検証ケースを**追記**するため、同一ファイルへの逐次追記となり並列不可。SQL（`rls_policy.test.sql`）と TS/E2E（`rls.integration.test.ts` / `magic-link.spec.ts`）のテンプレ本体は互いに素なファイルだが、**テスト基盤（新規 mjs）を共有する**ため PLAN で直列に確定する（下記「T1/T2 分割・直列判断」節）。
3. **識別子展開の実ドキュメント照合（SEC-01 / ASM-01 / src-rules.md AI Output Verification / リスク1）**: psql の識別子展開（`:"var"` ダブルクォート展開）と実行時変数上書き（`-v var=value`）が Supabase CLI が用いる psql の標準機能であることを、T1 実装時に psql / Supabase CLI 公式ドキュメントで照合してから確定する（幻覚フラグ混入防止）。照合した構文をテンプレコメント + README に残す。
4. **env fallback は実証済みパターンの横展開（FR-04 / リスク2）**: TS の `process.env.X ?? default` は現行 `magic-link.spec.ts`（L3-4）で既に使われている実証済みパターンで、`rls.integration.test.ts` へ同型に展開する。env 未設定時に default（`app_items` / `owner_id`）で動く = 旧挙動と観測的に同一であることを AC-03 で固定する。
5. **静的検証に限定（NFR-01 / ASM-04）**: 本リポ CI は実 Postgres / Supabase / ブラウザを起動しない。テストは (a) 変数集約 grep、(b) SQL の必須トークン（`\set` / `plan(6)` / 各アサーション）存在確認、(c) TS の必須トークン存在 + env fallback 解決の単体検証、に限る。実 RLS 挙動（実際に行が見える/見えない）は利用者環境依存でスコープ外。新規 npm 依存（SQL/YAML パーサ・fixture ローダ）はゼロで、`node:` 標準 + 文字列読取 + 正規表現で検証する（NFR-02）。
6. **依存ゼロ維持（NFR-02）**: パラメータ化・検証は既存前提（pgTAP は Supabase CLI 側、vitest / playwright は利用者側、`node:` 標準）のみで行う。`package.json` の runtime / dev dependencies を変えない（検証: `tests/cli/package.test.mjs` L135 の runtime dependencies 検査が継続 pass）。
7. **依存 SPEC の再確認（リスク5 / ASM-03 / INV-06）**: 本 PLAN 起票時に SPEC-0056（3-way managed file）の境界を再確認した。事前調査で `src/cli/managed-files.mjs` / `profile-docs.mjs` に supabase 参照が無く、supabase テンプレは manual-copy 配布物であることを確認済み（`grep -rn "supabase\|rls_policy\|app_items" src/cli/managed-files.mjs src/cli/profile-docs.mjs` = 0 件）。したがってテンプレ変更は SPEC-0056 の 3-way 経路を通らず既存コピーに追従しない。この非追従性を README（FR-08 / AC-05）に明記する。SPEC-0057（overlay）/ SPEC-0058（`.ai-check.yaml`）/ SPEC-0051（`security:sast`）にも本 SPEC を破る変更は無い。

### 案A vs 案B の比較（SPEC 確定案の再掲と PLAN 判断）

SPEC は**案A（テンプレ冒頭に設定変数ブロックを集約し、本文は変数を参照。env var fallback で編集レス注入も可能にする）**を確定済み。PLAN でもこれを踏襲する。

| 観点 | 案A: 冒頭集約 + 変数参照（採用） | 案B: 別 fixture ファイルへの切り出し（不採用） |
|---|---|---|
| manual-copy 制約との整合 | ◎ 1 ファイルをコピーして冒頭を直すだけ。CLI 展開に依存しない | △ pgTAP `\i` include / Vitest import 追加でファイル数・結合点が増え、単純さを損なう |
| 既存構造との接続 | ◎ UUID は既に `set_config` で集約済み（SQL）、接続情報は既に `requireEnv` で env 化済み（TS）。「冒頭集約」に自然接続 | △ 既に集約済みの UUID / 接続情報を fixture へ再移動する追加変更が要る |
| 変更量 | ◎ 冒頭に宣言追加 + 本文の識別子参照置換のみ | △ fixture ファイル新設 + 各テンプレの import/include 配線 |
| 将来の fixture 共有需要 | ○ 冒頭集約は fixture 切り出し（案B）へ additive に移行可能（OPS-02 / 契約 (3)）。案A は案B を排他しない | ◎ fixture 共有には最適だが、需要が未実証（OPS-02 で観測してから起票） |

**PLAN 判断**: 案A を採用する。案B は将来 fixture 共有需要が dogfooding / 利用者要望で実証された時点で別 SPEC に additive 検討する（OPS-02）。本 PLAN の冒頭集約は案B への移行余地を塞がない（SPEC 契約 (3)）。

代替案比較（テスト配置）:
- **`tests/templates/` に置く案**: 不採用。現行 `package.json` の `test` = `node --test tests/cli/*.test.mjs` は `tests/cli/` 配下のみを実行対象とするため、`tests/templates/` に置くと glob 非対象で CI 未実行になる。`tests/cli/supabase-rls-template.test.mjs` に置けば package.json 変更なしで既存 test に組み込まれ、`make validate` → validate-cli（Makefile 内 `node --test tests/cli/*.test.mjs`）経由で本リポ CI に自動包含される（SPEC File Scope の配置理由）。
- **既存テストファイルに相乗り案**: 不採用。RLS テンプレ検証は新規の観点（SQL/TS 変数集約・env fallback）で、既存 `tests/cli/*.test.mjs` の責務と混ざる。専用ファイル 1 本に集約して責務を分ける。

## T1/T2 分割・直列判断（Planning Agent 確定）

**確定: SPEC 実装メモの T1（SQL）/ T2（TS+E2E）/ T3（docs）分割を踏襲し、TASK-0227（SQL）→ TASK-0228（TS+E2E）→ TASK-0229（docs）に採番する。T1→T2→T3 は直列。**

分割根拠（レビュー観点差 + テスト基盤共有の 2 軸）:

1. **レビュー責務（Gate 観点）が SQL と TS で異なる**: SQL テンプレ（TASK-0227）は **Gate 3: Security の SEC-01（psql 識別子展開 `:"var"` の正しい使い分け / SQL インジェクション回避）** が主観点で、psql / Supabase CLI 公式ドキュメント照合（ASM-01）を伴う。TS テンプレ（TASK-0228）は **Gate 3: Security の SEC-02（service_role 非使用の維持）+ Gate 2 の env fallback（FR-04）** が主観点で、外部 SQL 構文照合は伴わない。同一タスクに混ぜると SQL 識別子展開レビューと service_role/env fallback レビューが 1 コミットに同居し、レビュー単位が肥大化する。独立コミットにすることで検証観点が 1:1 で観測しやすくなる。
2. **T1→T2 を直列にする決定的理由（テスト基盤共有）**: T1 が新規作成する `tests/cli/supabase-rls-template.test.mjs` に、T2 が TS/env fallback 検証ケースを**追記**する。同一新規ファイルへの逐次追記のため並列不可（同一ファイルへの並行追記を避ける — CLAUDE.md「同一 worktree で並行実行しない」の精神）。コミット順を「SQL テンプレ + テスト作成 → TS/E2E テンプレ + テスト追記」に固定して決定的にする。
3. **File Scope が（テンプレ本体は）互いに素**: TASK-0227 は `rls_policy.test.sql` + 新規 test（作成）、TASK-0228 は `rls.integration.test.ts` / `magic-link.spec.ts` + 新規 test（追記）、TASK-0229 は 3 つの docs のみを触る。テンプレ本体は素で、共有するのはテスト基盤のみ。各 File Scope は 10 ファイル未満で AP-02（Big Bang Prompt）の閾値に抵触しない。
4. **T3（docs）を最後にする理由**: docs（`supabase/README.md` の Checklist 簡素化 + `profiles/supabase-rls/README.md` / `prompts/rls-permission.md` のマッピングガイド）は、T1/T2 で確定した変数名（`table_name` / `owner_column` / `RLS_TABLE` / `RLS_OWNER_COLUMN`）と注入方法（`psql -v` / `process.env`）を文書化するため、テンプレ確定後に着手する（確定前の仕様を先に書かない）。T3 は T1/T2 の両方に依存する。

反証の検討（T1/T2 を 1 タスクに統合する可能性）: 「SQL と TS はいずれも『冒頭集約 + 本文置換』で同じ作業型」という統合論は成立しうるが、上記 1（SEC-01 vs SEC-02 の Gate 3 観点差 + SQL 公式ドキュメント照合の有無）が「実質同じレビュー単位ではない」ことを示す。特に psql 識別子展開の公式ドキュメント照合（ASM-01 / SEC-01）は SQL 固有の verification ステップであり、これを TS の service_role/env fallback 変更と束ねると「識別子展開の照合漏れ」が「TS 変更」に紛れて見落とされるリスクがある。したがって分割を確定する。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0227 | SQL テンプレ（`rls_policy.test.sql`）の変数集約（冒頭 `\set` ブロック + 本文の `:"var"` 識別子展開参照）+ 新規 `tests/cli/supabase-rls-template.test.mjs` 作成（SQL 変数集約 grep + SQL 妥当性 + `-v` fallback 検証ケース）。psql 識別子展開 / `-v` の公式ドキュメント照合を含む（SPEC T1） | Implementation | 3h | なし | No（TASK-0228 が同一新規テストファイルに追記） |
| TASK-0228 | TS / E2E テンプレ（`rls.integration.test.ts` の変数集約 + env fallback / `magic-link.spec.ts` の見出し整合）+ 新規テストへの TS 検証ケース追記（TS 変数集約 grep + env fallback + TS 静的妥当性）（SPEC T2） | Implementation | 3h | TASK-0227 | No |
| TASK-0229 | ドキュメント更新（`supabase/README.md` の Replacement Checklist 簡素化 + `profiles/supabase-rls/README.md` / `prompts/rls-permission.md` のマトリクス → テスト変数マッピングガイド追記）（SPEC T3） | Implementation | 2h | TASK-0227, TASK-0228 | No |

### AC 対応

- **TASK-0227** → AC-01（`rls_policy.test.sql` の `\set` 宣言行を除く本文に `app_items` / `owner_id` 直書き 0 件 + 冒頭に `\set table_name` + 本文が `:"table_name"` 識別子展開参照）、AC-03(SQL)（psql `-v table_name=<name>` 指定時に対象テーブルが切替、無指定時に `\set` default が有効 — 構文レベル/dry-run 相当で検証）、AC-04(SQL)（`plan(6)` 件数・許可/拒否アサーション保存、psql パース可能）。FR-01 / FR-02 / SEC-01 / SEC-03 / INV-01 / INV-02 / INV-03 / INV-04 / PRE-01。
- **TASK-0228** → AC-02（`rls.integration.test.ts` の宣言ブロック外に `app_items` / `owner_id` 直書き 0 件 + 冒頭に `const TABLE = process.env.RLS_TABLE ?? "app_items"` + 本文が `TABLE` / `OWNER` 参照 + TS パース/型健全）、AC-03(TS)（`process.env.RLS_TABLE` 未設定で default `app_items`、設定時にその値へ切替 — 変数解決部分を単体検証）、AC-04(TS/E2E)（`magic-link.spec.ts` 含む TS 系テンプレのパース健全性 + `describe`/`test` 構造保存）。FR-03 / FR-04 / FR-05 / SEC-02 / SEC-03 / INV-01 / INV-02 / INV-03 / INV-05 / PRE-01 / PRE-02 / POST-01。
- **TASK-0229** → AC-05（`supabase/README.md` の Replacement Checklist が「設定変数ブロック 1 箇所編集 / env 注入」に簡素化 + SQL/TS/Playwright の変数一覧 + 2 注入方法 + `service_role` 非使用注意書き残存 + manual-copy 非追従性明記）、AC-06（`profiles/supabase-rls/README.md` と `prompts/rls-permission.md` にマトリクス → テスト変数マッピングガイド存在 + `rls-permission.md` マトリクス生成プロンプト本体無変更）。FR-06 / FR-07 / FR-08 / SEC-02 / SEC-03 / POST-02。
- **AC-04 の TS 側妥当性**（`magic-link.spec.ts` パース健全性）は TASK-0228 が主だが、SQL 妥当性は TASK-0227 が担う（AC-04 は unit + integration にまたがるため両 TASK に配分）。
- **全テストパス**（既存 `node --test tests/cli/*.test.mjs` 全件無修正 pass = NFR-01 後方互換）は全 TASK 共通の完了条件で、Round 全体の最終確認は `tasks/done-def-SPEC-0063-round-1.md` の Functional Gate で行う。

### NFR-04 分岐対応

各新規要素は最低 1 テストケースで固定する:
- 変数集約（SQL 本文ハードコード不在）= TASK-0227（テンプレ + テストケース）
- 変数集約（TS 本文ハードコード不在）= TASK-0228（テンプレ + テストケース）
- SQL 構文健全性（`plan(6)` / アサーション保存）= TASK-0227
- TS パース/型健全性（`describe`/`test` 保存）= TASK-0228
- env fallback（SQL `-v` 上書き相当）= TASK-0227
- env fallback（TS `process.env` 上書き）= TASK-0228

### 依存グラフ

```
TASK-0227 (SQL テンプレ + 新規テスト作成)
    │  同一新規テストファイルへの追記のため直列
    ▼
TASK-0228 (TS/E2E テンプレ + テスト追記)
    │  確定変数名・注入方法を docs 化するため直列
    ▼
TASK-0229 (docs 3 ファイル)
```

TASK-0227 → TASK-0228 → TASK-0229 は全て直列。TASK-0228 と TASK-0229 は File Scope が理論上素だが、TASK-0229 の docs 内容が TASK-0227/0228 のテンプレ確定（変数名・注入方法）に依存するため直列運用を採用する。各 TASK は独立コミット（commit message に TASK-ID 必須 = commit-msg hook 強制 = AP-05 対策）。

反証（テストファイル分割による並列化の棄却）: 新規テストを `*-sql.test.mjs` / `*-ts.test.mjs` に分割すれば TASK-0227/0228 の File Scope は素になり並列化できるが、本 PLAN は採らない。理由: (a) RLS テンプレ変数集約という単一検証観点を 2 ファイルに分散させると AC-01〜AC-04 の一体レビュー窓口が失われる、(b) 新規ファイル数を増やし単純さ（NFR-02 の最小変更方針）を損なう。テスト基盤は 1 ファイルに集約し直列運用する。

## リスク

- リスク1（SPEC リスク1）: psql の識別子展開（`:"table_name"`）が利用者の psql / Supabase CLI バージョンで期待どおり動かない、または `-v` の受け渡し方が環境で異なる → 軽減策: 識別子展開は psql 標準機能であり、テンプレ冒頭の `\set` default で「env/`-v` 無指定でもそのまま動く」状態を保証する（AC-03 で default 動作を固定）。TASK-0227 実装時に psql / Supabase CLI 公式ドキュメントで `:"var"` 展開と `-v` の挙動を照合する（src-rules.md AI Output Verification / ASM-01 / 幻覚フラグ混入防止）。照合結果をテンプレコメント + README に残す。
- リスク2（SPEC リスク2）: TS の `process.env.X ?? default` が、利用者のテストランナー設定（env 読み込みタイミング）で default に落ちる → 軽減策: env fallback は現行 `magic-link.spec.ts`（L3-4）で既に使われている実証済みパターンで、`rls.integration.test.ts` へ同型展開する（新規リスクは小さい）。env 未設定時に default で動く（= 旧挙動と同一）ことを AC-03 で固定し、env が効かない事例は OPS-01 で観測する。
- リスク3（SPEC リスク3）: 本文の置換漏れで「変数集約したつもりが一部ハードコードのまま別テーブルを検証」 → 軽減策: AC-01 / AC-02 の grep で設定変数ブロック外（`\set` / `const ... = process.env` 宣言行を除外）の直書きを 0 件検証し、機械的に置換漏れを検出する（文章ルールでなくテストでガード = AP-06 Human-Only Guard 回避）。SQL は本文 10 箇所（`app_items` 5 + `owner_id` 5）、TS は本文 8 箇所（`app_items` 3 + `owner_id` 5）を全て置換する。
- リスク4（SPEC リスク4）: パラメータ化で pgTAP の `plan()` 件数やアサーションの意味を意図せず変える → 軽減策: NFR-03 / INV-03 で検証意図の保存を要求し、AC-04 で `plan(6)` 件数・許可/拒否アサーション（`lives_ok`/`isnt_empty`/`is_empty`/`results_eq`/`throws_ok`）・`describe`/`test` 構造の保存を検証する。変数化は「識別子の参照方法」だけを変え、テストロジックを変えない。
- リスク5（SPEC リスク5）: 既存コピー済み利用者が「update で新形式が降ってくる」と誤解する → 軽減策: manual-copy ゆえ追従しないことを README（FR-08 / AC-05）に明記する（TASK-0229）。ASM-03 / INV-06 のとおり supabase テンプレは CLI 管理外で SPEC-0056 3-way 経路に載らない。混乱事例は OPS-01 で観測する。
- リスク6（SPEC リスク6）: 機構を撤去する必要が生じた場合 → 軽減策: 変更はテンプレ内容 + docs に閉じ（`src/cli/` 不変 = INV-06）、テンプレを旧ハードコード形に戻せば現行に戻る。CLI 経路を作らないため撤去の影響範囲がテンプレ + docs に限定される。手順: TASK-0227〜0229 の commit を **逆順**（TASK-0229 → TASK-0228 → TASK-0227）で `git revert` し `node --test tests/cli/*.test.mjs` で復旧確認（tests/cli/supabase-rls-template.test.mjs への逐次追記のため revert 順序が重要）。
- 実装リスク7: 新規 `tests/cli/supabase-rls-template.test.mjs` の grep 除外正規表現（`\set` 宣言行 / `const ... = process.env` 宣言行の除外）が緩すぎて本文の置換漏れを見逃す、または厳しすぎて宣言行の default を誤検出する → 軽減策: 除外は行頭パターン（SQL: `^\s*\\set\b`、TS: `process.env` を含む `const` 宣言行）で限定し、除外後の本文に対して `\bapp_items\b` / `\bowner_id\b` を検査する。この除外設計は SPEC AC-01 / AC-02 が一次情報源（実装メモではなく AC 側で確定）。TASK-0227（SQL）で除外パターンを確立し TASK-0228（TS）で踏襲する。

## 必要な検証

- [x] unit test（変数集約 grep = AC-01 / AC-02 / FR-01 / FR-03、env fallback = AC-03 / FR-02 / FR-04、SQL/TS 静的妥当性 = AC-04 / NFR-03。`tests/cli/supabase-rls-template.test.mjs` 新規）
- [x] integration test（SQL/TS テンプレのパース健全性・検証意図保存 = AC-04、既存 `node --test tests/cli/*.test.mjs` 全件無修正 pass = NFR-01 後方互換 / INV-01 / INV-03 / PRE-01 / POST-01 / POST-02。新規テスト + 既存全件）
- [x] security scan（Gate 3: SQL 識別子展開 `:"var"` の正しい使い分け = SEC-01 / INV-04、`service_role` 非使用の維持（anon key + user session 経路 + 「service-role bypass warning」コメント残存）= SEC-02 / INV-05 / PRE-02、secret 非混入（UUID `0000...0001` / URL `127.0.0.1` / email `.test` の非機密 default 維持）= SEC-03、`bash scripts/sage-validate.sh` 範囲、`rg "TODO|FIXME"` 新規マーカー不在、新規 npm 依存なし = NFR-02（`tests/cli/package.test.mjs` L135 の dependencies 検査））
- [x] e2e test（**N/A**: 理由 = 観測面は「テンプレファイルの内容」で、本リポ CI では実 Postgres / Supabase / ブラウザを起動しない（NFR-01 / ASM-04）。実 RLS 挙動（実際に行が見える/見えない）は利用者環境依存でスコープ外節に明記。テンプレの正しさは静的検証（変数集約 grep・SQL/TS 妥当性・env fallback 解決）+ 公式ドキュメント照合で担保する）
- [x] architecture boundary check（Gate 4: File Scope 外の無変更確認 — `src/cli/`（`managed-files.mjs` / `profile-docs.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs` — manual-copy 境界保存 = INV-06 / ASM-03）/ `package-templates/package.scripts.fragment.json` / `src/cli/profile-scripts.mjs`（`security:sast` = `semgrep scan --config auto` 不変 = SPEC-0051 / スコープ外節）/ `package.json`（新規テストは `tests/cli/` glob 対象のため scripts 無変更）/ `docs/cli.md`（CLI surface 不変）/ 他 profile README の diff がゼロ。本リポ root `CLAUDE.md` / `.claude/rules/` / `sage/` 無変更）

## 知識管理要約

- 各 TASK 実装中の想定外エラーは担当 Agent が TASK-ID 付きで `.sage/runs/` に記録し、新規パターンなら `sage/failures.md` に FAIL-XXXX 形式で記録する（`sage/anti-patterns.md` 照合、3 回累積時の昇格判断は done-def の Error Resolution 手順に従う）。RLS 変数注入の失敗（変数集約したが本文に置換漏れ / env 注入が効かない）を記録する際は症状欄冒頭に原因タグ『rls: 変数注入漏れ』を付し、既存 `cause` enum（trust-boundary / code-reading / spec-misinterpretation / not-applicable / other）の該当値と併記する（OPS-01。原因タグは cause enum を置き換えず補助的に追加する。判定: 次マイナーバージョン PLAN 起票時に `grep -c 'rls: 変数注入漏れ' sage/failures.md` で機械確認、3 回累積で変数集約の粒度見直し（案B fixture 切り出し検討を含む）を別 SPEC 起票）。
- 「manual-copy 配布物は SPEC-0056 の 3-way managed file 経路の対象外であり、テンプレ変更は既存コピーに追従しない」は既知の境界（事前調査で `src/cli/managed-files.mjs` / `profile-docs.mjs` に supabase 参照が無いことを確認済み = ASM-03 / INV-06）であり、新規パターンとして記録しない。破ると「テンプレを変えたのに利用者に届く/届かない」の期待違いが起きるため FR-08 / AC-05 で README に明記する。
- 「利用者スキーマ由来の識別子（テーブル名・列名）を SQL に埋め込む」のは信頼境界の扱いを要する箇所（ASM-02）であり、psql 識別子展開（`:"var"`）と値展開（`:'var'`）の使い分けを SEC-01 で明示し、テンプレコメント + README + AC-01（`:"var"` 参照形の存在確認）でガードする。
- 本 PLAN は CLAUDE.md 本体 / `.claude/rules/*.md` / `sage/` を変更しない（SPEC 知識管理節のとおり。理由: RLS テストテンプレのパラメータ化は配布物 `package-templates/supabase/` の内容変更で本リポの開発運用ルールに影響しない。配布物の一次情報源は `package-templates/supabase/README.md` / `profiles/supabase-rls/README.md` で CLAUDE.md / `ai-check-template.md` は既に参照型。CLI surface 不変なので `docs/cli.md` も対象外。sage-managed 保護対象のため将来変更が必要と判明した場合は human approval を得て別 TASK 起票）。
- テスト期待値は SPEC 契約節から導出し、AC-N 参照をテストケース名に付す（テストケース名は日本語 = 言語規約）。

## 段階採用 / ロールバック

- 影響ゼロ（後方互換）: env / `-v` を一切指定しない場合、SQL は冒頭 `\set` の default（`app_items` / `owner_id`）、TS は `?? "app_items"` の default が有効になり、**本 SPEC 適用前の旧テンプレと観測的に同一の対象**でテストが構成される（INV-02 / POST-01。AC-03 の default 動作検証が継続確認）。新テンプレは default 値のまま有効な SQL / TS であり（POST-01）、既にコピー済みの旧ハードコード形テンプレも有効な SQL / TS のまま動作する（POST-02 / FR-08。manual-copy ゆえ変更が降ってこない = INV-06）。
- 段階採用: 新形式は**新規コピー分にのみ**適用される（manual-copy 非追従性）。既存利用者は自分のタイミングで再コピー or 冒頭ブロック手動追加によって移行でき、強制されない。tenant 列を使わないスキーマは tenant 変数をオプショナル扱いにでき（境界ケース1 / AC-04）、必須化しない。
- ロールバック: 追加はテンプレ内容（冒頭集約 + 本文置換）+ docs 追記のみのため、テンプレを旧ハードコード形に戻せば現行に戻る（TASK-0227〜0229 の commit を **逆順**（TASK-0229 → TASK-0228 → TASK-0227）で `git revert` し `node --test tests/cli/*.test.mjs` で復旧確認（tests/cli/supabase-rls-template.test.mjs への逐次追記のため revert 順序が重要））。`src/cli/` を触らない（INV-06）ため撤去の影響範囲がテンプレ + docs + 新規テストに閉じる。`security:sast`（SPEC-0051）/ 他 profile / CLI surface は不変。
- ロールバック後の利用者影響: 既に新形式テンプレをコピーして冒頭変数を自スキーマに書き換えた利用者環境のファイルは利用者のコミット下にあり、本パッケージのロールバックでは変更されない（manual-copy ゆえ配布物の revert は利用者リポの committed ファイルに遡及しない = INV-06）。既存コピー済み利用者（旧形式）は元から追従していないため影響なし。
- 観測: v1 リリース後 1 リリースサイクル、「変数集約したが本文に置換漏れが残り別テーブルを検証していた」「env 注入が効かない」事例を `sage/failures.md`（原因タグ『rls: 変数注入漏れ』）で観測する（OPS-01）。3 回累積で変数集約の粒度見直し（案B fixture 切り出し検討）を別 SPEC 起票。fixture 切り出し需要（案B）が dogfooding / 利用者要望で確認されたら別 SPEC で `rls-fixtures.example.(sql|ts)` を additive 検討する（OPS-02。案A 冒頭集約は案B への移行余地を塞がない = 契約 (3)）。
- rules 連携（AP-06 対策の明示）: 本 SPEC の Forbidden Shortcuts（`src/cli/` 変更禁止・本文ハードコード残存禁止・`:'var'` 誤用禁止・`service_role` 混入禁止・secret 例示禁止・`plan()` 件数/アサーション変更禁止・`security:sast` 変更禁止・prompt 本体変更禁止・npm 依存追加禁止・File Scope 外変更禁止・TASK-ID 欠落コミット禁止）は AC-01〜AC-06 + 既存 dependencies 検査 + File Scope hook + レビューの機械/手動ガードで検証されるため（AP-06 Human-Only Guard 対策として文章ルールではなく機械ガードを主軸に採用）、CLAUDE.md / `ai-check-template.md` への追記は不要（SPEC 知識管理節のとおり）。
