# TASK-0228: TS / E2E テンプレの変数集約 + env fallback + テスト追記

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0228 |
| SPEC-ID   | SPEC-0063 |
| PLAN-ID   | PLAN-0063 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No（TASK-0227 が作成した `tests/cli/supabase-rls-template.test.mjs` に TS 検証ケースを追記するため直列） |
| 着手条件 | TASK-0227 が commit 済み（tests/cli/supabase-rls-template.test.mjs 作成後）であること — 同一ファイルへの追記のため |
| 依存TASK  | TASK-0227 |
| 見積     | 3h |

## 責務

`package-templates/supabase/tests/rls/rls.integration.test.ts`（Vitest）をスキーマ非依存にパラメータ化し、`package-templates/supabase/tests/e2e/magic-link.spec.ts`（Playwright）の既存 env 変数を設定変数ブロック見出しに整合させる（SPEC T2）。TS は冒頭に `const TABLE = process.env.RLS_TABLE ?? "app_items"` / `const OWNER = process.env.RLS_OWNER_COLUMN ?? "owner_id"` を集約し本文を変数参照に置換する。あわせて TASK-0227 が作成した新規テストに TS 変数集約 grep・env fallback・TS 静的妥当性の検証ケースを追記する。

## 入力

- SPEC-0063 FR-03 / FR-04 / FR-05、SEC-02 / SEC-03、NFR-01 / NFR-02 / NFR-03 / NFR-04、AC-02 / AC-03(TS) / AC-04(TS/E2E)、異常系1 / 異常系4、境界ケース1 / 境界ケース2、契約 (1)、実装メモ「TS 変数集約」「Playwright 見出し整合」、リスク2 / リスク3 / リスク4、INV-01 / INV-02 / INV-03 / INV-05、PRE-01 / PRE-02、POST-01 / POST-02
- 現行テンプレの置換対象（事前調査で確認済みの本文箇所）:
  - `rls.integration.test.ts`: `.from("app_items")` 3 箇所（L12 / L20 / L32）→ `.from(TABLE)`、`.select("id, owner_id")` 2 箇所（L13 / L21）→ ``.select(`id, ${OWNER}`)``、`.eq("owner_id", ...)` 3 箇所（L14 / L22 / L34）→ `.eq(OWNER, ...)`
  - 変数宣言の配置: import 群（L1-2）の直後、`describe`（L7）の前に `const TABLE = ...` / `const OWNER = ...` を宣言する
  - `createUserClient`（L42-55）/ `requireEnv`（L57-65）/ 「service-role bypass warning」コメント（L45-47）/ 接続情報の既存 `requireEnv(...)` 集約（`SUPABASE_URL` / `SUPABASE_ANON_KEY` / session / user id）は**不変**（SEC-02 / INV-05）
  - `magic-link.spec.ts`: 既存 `const mailApiUrl = process.env.SUPABASE_LOCAL_MAIL_API_URL ?? "http://127.0.0.1:54324/api/v1"`（L3）/ `const testEmail = process.env.SUPABASE_TEST_EMAIL ?? "user@example.test"`（L4）を、SQL/TS と同一の見出しコメント（例: `// --- 設定変数（環境に合わせて編集 / env で注入）---`）でファイル冒頭にまとめる。**default 値・fetch・locator・フロー本体は不変（機能変更なし）**（FR-05）
- env fallback（FR-04）: `process.env.RLS_TABLE` 等が設定されていればその値、未設定なら宣言ブロックの default（`app_items` / `owner_id`）を使う。env 未設定時の挙動は現行と観測的に同一（現行 `magic-link.spec.ts` L3-4 の実証済みパターンを同型展開 — リスク2）
- service_role 非使用の維持（SEC-02 / INV-05 / 異常系4）: 変数化で接続情報の注入先が増えても、特権キー（`service_role`）の default / 例示を混入させない。anon key + user session 経路と「service-role bypass warning」コメントを維持する
- 言語規約: テンプレ内コメントは既存 TS コメントのスタイル（英語）に揃える。見出しコメント（`// --- 設定変数 ... ---`）は SQL/TS 3 ファイルで統一する
- 新規テスト（`tests/cli/supabase-rls-template.test.mjs`）への TS 検証ケース追記設計: TS テンプレを文字列で読み、`const\s+\w+\s*=\s*process\.env` を含む宣言行を除外した本文に `/\bapp_items\b/` / `/\bowner_id\b/` がヒットしないこと（AC-02）、冒頭に `const TABLE = process.env.RLS_TABLE ?? "app_items"` 相当と本文の `TABLE` / `OWNER` 参照が存在すること（AC-02）、env fallback（`process.env.RLS_TABLE` 未設定で default `app_items`、設定時にその値へ切替）を変数解決部分の単体で確認すること（AC-03）、`describe`/`test` 構造 + `magic-link.spec.ts` のパース健全性が保存されていること（AC-04）。テストケース名は日本語 + AC-N 参照

## 出力

- `package-templates/supabase/tests/rls/rls.integration.test.ts`（変更）: 冒頭に `const TABLE` / `const OWNER` 宣言ブロック追加、本文の `.from(...)` 3 箇所 / `.select(...)` 2 箇所 / `.eq(...)` 3 箇所を変数参照に置換。`createUserClient` / `requireEnv` / service-role warning は不変
- `package-templates/supabase/tests/e2e/magic-link.spec.ts`（変更）: 既存 env 変数（L3-4）を設定変数ブロック見出しでまとめる。値・fetch・locator・フロー本体は不変
- `tests/cli/supabase-rls-template.test.mjs`（**追記**）: TS 変数集約 grep（AC-02）+ env fallback（AC-03）+ TS 静的妥当性（AC-04）の検証ケースを TASK-0227 作成分に追記

## File Scope（変更許可範囲）

- 変更: `package-templates/supabase/tests/rls/rls.integration.test.ts`
- 変更: `package-templates/supabase/tests/e2e/magic-link.spec.ts`
- 変更（追記）: `tests/cli/supabase-rls-template.test.mjs`
- 作成: なし
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- `src/cli/` の変更の禁止 — supabase テンプレは manual-copy のまま（検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー — INV-06）
- 本文への `app_items` / `owner_id` リテラル直書きの残存の禁止 — 宣言ブロックに集約し本文は `TABLE` / `OWNER` 参照（検出: AC-02 の grep で本文ハードコード 0 件。本文 `app_items` 3 箇所 + `owner_id` 5 箇所を全て置換 — 異常系3 / リスク3）
- `service_role` / 特権キーを使う経路・default・例示の新設の禁止 — anon key + user session 経路と「service-role bypass warning」コメントを維持（検出: レビュー + テンプレ内 anon key 経路の残存確認 — SEC-02 / INV-05 / 異常系4。最終的な service-role 非使用の確認は AC-05 のレビューが一次情報源）
- `magic-link.spec.ts` の default 値・fetch・locator・認証フロー本体の変更の禁止 — 見出し整合のみ（機能変更なし。検出: レビューで既存 assert / フローの無変更確認 — FR-05 / スコープ外節）
- `describe`/`test` 構造・アサーションの許可/拒否の意味の変更の禁止 — 変数化は識別子参照のみ（検出: AC-04 の検証意図保存 + 既存テストの無修正 pass — NFR-03 / INV-03）
- 接続情報の既存 `requireEnv(...)` 集約（`SUPABASE_URL` / `SUPABASE_ANON_KEY` / session / user id）の破壊の禁止 — 維持する（検出: レビュー — FR-03 / 既存実装との衝突点）
- 実在 secret / 本番 URL / 本番 email の例示混入の禁止 — 非機密ダミー（`127.0.0.1` / `.test`）を維持（検出: レビュー + テンプレ grep — SEC-03）
- `security:sast`（`semgrep scan --config auto`）の変更の禁止（検出: `package.scripts.fragment.json` / `profile-scripts.mjs` の無変更確認 — SPEC-0051 保存）
- 新規 npm 依存（fixture ローダ等）の追加の禁止（検出: `tests/cli/package.test.mjs` の dependencies 検査 + レビュー — NFR-02）
- File Scope 外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME を残してコミットすることの禁止（src-rules.md Forbidden shortcuts）
- commit message に TASK-0228 を含めないコミットの禁止（commit-msg hook で強制）

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol。RLS 変数注入関連は症状欄冒頭に原因タグ『rls: 変数注入漏れ』を付し、既存 `cause` enum の該当値と併記する — OPS-01）
- [ ] `rls.integration.test.ts` の冒頭に `const TABLE = process.env.RLS_TABLE ?? "app_items"` / `const OWNER = process.env.RLS_OWNER_COLUMN ?? "owner_id"` が存在する（AC-02 / FR-03）
- [ ] 宣言ブロック外の本文に `app_items` / `owner_id` のリテラル直書きが 0 件で、本文の `.from(...)` 3 箇所 / `.select(...)` 2 箇所 / `.eq(...)` 3 箇所が `TABLE` / `OWNER` を参照している（`grep` で検証 — AC-02 / FR-03 / リスク3）
- [ ] env fallback: `process.env.RLS_TABLE` 未設定で default（`app_items`）、設定時にその値へ切り替わる（変数解決部分を単体で検証 — AC-03 / FR-04 / 異常系1）
- [ ] `magic-link.spec.ts` の既存 env 変数（`mailApiUrl` / `testEmail`）が設定変数ブロック見出しにまとまり、default 値・fetch・locator・フロー本体が不変である（FR-05。レビューで既存 assert / フローの無変更確認）
- [ ] anon key + user session 経路と「service-role bypass warning」コメント（L45-47 相当）が維持され、`service_role` / 特権キーの default / 例示が混入していない（SEC-02 / INV-05 / 異常系4）
- [ ] `describe`/`test` 構造とアサーションの許可/拒否の意味が保存され、接続情報の既存 `requireEnv(...)` 集約が維持されている（AC-04 / NFR-03 / INV-03）
- [ ] `tests/cli/supabase-rls-template.test.mjs` に TS 変数集約 grep（AC-02）・env fallback（AC-03）・TS 静的妥当性（`describe`/`test` 保存 + `magic-link.spec.ts` パース健全性 = AC-04）の検証ケースを追記した。各テストケース名は日本語 + AC-N 参照
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし、既存テストが無修正で pass する（AC-02 / AC-03 / AC-04 / NFR-01）
- [ ] `src/cli/` / `package.scripts.fragment.json` / `profile-scripts.mjs` の diff がゼロである（INV-06 / SPEC-0051）
- [ ] `git diff --check` が pass する（trailing whitespace / 行末改行の混入なし — src-rules.md Intentional changes only）
- [ ] commit message に TASK-0228 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0063-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
