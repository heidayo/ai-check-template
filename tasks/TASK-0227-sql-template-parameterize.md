# TASK-0227: SQL テンプレ（rls_policy.test.sql）の変数集約 + 新規テスト作成

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0227 |
| SPEC-ID   | SPEC-0063 |
| PLAN-ID   | PLAN-0063 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No（TASK-0228 が同一新規テストファイル `tests/cli/supabase-rls-template.test.mjs` に追記するため追記順序を固定する） |
| 依存TASK  | なし |
| 見積     | 3h |

## 責務

`package-templates/supabase/tests/database/rls_policy.test.sql`（pgTAP）をスキーマ非依存にパラメータ化する（SPEC T1）。冒頭に設定変数ブロック（`\set table_name app_items` / `\set owner_column owner_id`）を集約し、本文の `app_items` / `owner_id` を `format('%I', :'var')` イディオムで参照させる（ドル引用符 `$$...$$` 内では psql 変数展開が効かないため、値展開 `:'var'` を format() の外から渡し `%I` で安全に識別子化する）。あわせて新規テスト `tests/cli/supabase-rls-template.test.mjs` を作成し、SQL の変数集約 grep・SQL 妥当性・`-v` fallback の検証ケースを固定する。

## 入力

- SPEC-0063 FR-01 / FR-02、SEC-01 / SEC-03、NFR-01 / NFR-02 / NFR-03 / NFR-04、AC-01 / AC-03(SQL) / AC-04(SQL)、異常系1 / 異常系2 / 異常系3、境界ケース1、契約 (1)、実装メモ「SQL 変数集約」、リスク1 / リスク3 / リスク4、INV-01 / INV-02 / INV-03 / INV-04、PRE-01、ASM-01 / ASM-02
- 現行テンプレの置換対象（事前調査で確認済みの本文箇所）:
  - `app_items` 本文 5 箇所: L25 / L34 / L42 / L51 / L62（`from app_items` / `update app_items` / `insert into app_items`）→ `format('%I', :'table_name')` に置換
  - `owner_id` 本文 5 箇所: L26 / L35 / L44 / L53 / L62（`where owner_id = ...` / `insert into app_items (owner_id)`）→ `format('%I', :'owner_column')` に置換
  - L11 の注記コメント（`-- Replace app_items / owner_id with ...`）は設定変数ブロックの説明に更新する
  - 既存 UUID 集約（L8-9 の `set_config('app.test_user_a', ...)`）・`plan(6)`（L5）は**不変**
- 設定変数ブロックの配置: 既存 `set_config('app.test_user_a', ...)` 集約（L8-9）の近傍に `\set table_name app_items` / `\set owner_column owner_id` を追加する。tenant 列を使う場合の `\set tenant_column ...` はオプショナルで、default では宣言しても本文で使わない形にするか、コメントで示す（境界ケース1: tenant 変数を必須にしない）
- 識別子注入の正しさ（SEC-01 / INV-04）: 識別子（テーブル名・列名）は `format('%I', :'var')` で注入する。ドル引用符 `$$...$$` 内では psql の `:'var'`/`:"var"` 変数展開が効かないため、値展開 `:'var'` を format() の引数として外から渡し、`%I` が予約語・スペースを含む識別子でも安全にクォートする。テンプレコメントにこのイディオムを明記する
- 実ドキュメント照合（ASM-01 / src-rules.md AI Output Verification）: psql の `:'var'` 値展開・`format('%I')`・`-v var=value` の挙動が Supabase CLI が用いる psql の標準機能であることを公式ドキュメントで照合してから確定する（ドル引用符内で変数展開が効かない点を含む。幻覚フラグ混入防止）
- 言語規約: テンプレ内コメントは既存 SQL コメントのスタイル（英語）に揃える。見出しは既存に合わせる
- 新規テスト（`tests/cli/supabase-rls-template.test.mjs`）の SQL 検証ケース設計: SQL テンプレを文字列で読み、`^\s*\\set\b` で始まる宣言行を除外した本文に `/\bapp_items\b/` / `/\bowner_id\b/` がヒットしないこと（AC-01）、冒頭に `\set table_name` 宣言と本文の `format('%I', :'table_name')` 参照が存在すること（AC-01）、`plan(6)` トークンと 6 アサーション（`lives_ok`/`isnt_empty`/`is_empty`/`lives_ok`/`results_eq`/`throws_ok`）が保存されていること（AC-04）、`-v` fallback（`\set` default が env/`-v` 無指定時に有効）を構文レベルで確認すること（AC-03）。テストケース名は日本語 + AC-N 参照

## 出力

- `package-templates/supabase/tests/database/rls_policy.test.sql`（変更）: 冒頭に `\set table_name` / `\set owner_column` の設定変数ブロック追加、本文の `app_items` 5 箇所を `format('%I', :'table_name')`・`owner_id` 5 箇所を `format('%I', :'owner_column')` に置換。`plan(6)` / 既存 UUID 集約は不変
- `tests/cli/supabase-rls-template.test.mjs`（**新規作成**）: SQL 変数集約 grep（AC-01）+ SQL 妥当性（AC-04）+ `-v` fallback（AC-03）の検証ケース。TS 側のケースは TASK-0228 が追記する

## File Scope（変更許可範囲）

- 変更: `package-templates/supabase/tests/database/rls_policy.test.sql`
- 作成: `tests/cli/supabase-rls-template.test.mjs`
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- `src/cli/` の変更の禁止 — supabase テンプレは manual-copy のまま。CLI 管理化はスコープ外（触れたら設計を疑う。検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー — INV-06）
- 本文への `app_items` / `owner_id` リテラル直書きの残存の禁止 — 設定変数ブロックに集約し本文は `format('%I', :'var')` 参照（検出: AC-01 の grep で本文ハードコード 0 件 — 異常系3 / リスク3）
- ドル引用符内での生の変数参照の禁止 — 識別子注入は `format('%I', :'var')` を使う（`$$...$$` 内の `:'var'`/`:"var"` は展開されない）（検出: AC-01 の `format(`+`%I`+`:'var'` 参照形存在確認 + AC-04 の SQL 妥当性 + レビュー — SEC-01 / INV-04 / 異常系2）
- `plan()` 件数（`plan(6)`）・アサーションの許可/拒否の意味・pgTAP 構造の変更の禁止 — 変数化は識別子参照のみ（検出: AC-04 の検証意図保存 + 既存テストの無修正 pass — NFR-03 / INV-03）
- 既存 UUID 集約（`set_config('app.test_user_a', ...)`）の変更の禁止 — 既にパラメータ化済みで二重管理にしない（検出: レビュー — 既存実装との衝突点）
- 実在 secret / 本番 URL / 本番 email の例示混入の禁止 — 非機密ダミー（`0000...0001` / `127.0.0.1` / `.test`）を維持（検出: レビュー + テンプレ grep — SEC-03）
- `security:sast`（`semgrep scan --config auto`）の変更の禁止（検出: `package.scripts.fragment.json` / `profile-scripts.mjs` の無変更確認 — SPEC-0051 保存）
- 新規 npm 依存（SQL パーサ・fixture ローダ）の追加の禁止（検出: `tests/cli/package.test.mjs` の dependencies 検査 + レビュー — NFR-02）
- File Scope 外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME を残してコミットすることの禁止（src-rules.md Forbidden shortcuts）
- commit message に TASK-0227 を含めないコミットの禁止（commit-msg hook で強制）

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol。RLS 変数注入関連は症状欄冒頭に原因タグ『rls: 変数注入漏れ』を付し、既存 `cause` enum の該当値と併記する — OPS-01）
- [ ] `rls_policy.test.sql` の冒頭に `\set table_name app_items` / `\set owner_column owner_id` の設定変数ブロックが存在する（AC-01 / FR-01）
- [ ] `\set` 宣言行を除いた本文に `app_items` / `owner_id` のリテラル直書きが 0 件で、本文が `format('%I', :'table_name')` / `format('%I', :'owner_column')` の識別子展開で参照している（`grep` で検証。本文 `app_items` 5 箇所 + `owner_id` 5 箇所を全て置換 — AC-01 / FR-01 / リスク3）
- [ ] 識別子注入が `format('%I', :'var')` で、ドル引用符内に生の変数参照を置いていない。イディオムをテンプレコメントに明記している（SEC-01 / INV-04 / 異常系2）
- [ ] psql の `:'var'` 値展開・`format('%I')`・`-v var=value` 上書きを公式ドキュメントで照合し、`\set` default が env/`-v` 無指定時に有効であることを確認している（ASM-01 / リスク1 / src-rules.md AI Output Verification）
- [ ] `plan(6)` の件数、6 アサーション（`lives_ok`/`isnt_empty`/`is_empty`/`lives_ok`/`results_eq`/`throws_ok`）の許可/拒否の意味、既存 UUID 集約（`set_config`）が保存されている（AC-04 / NFR-03 / INV-03）
- [ ] `tests/cli/supabase-rls-template.test.mjs` を新規作成し、SQL 変数集約 grep（AC-01）・SQL 妥当性（`plan(6)` / アサーション保存 = AC-04）・`-v` fallback（`\set` default = AC-03）の検証ケースがある。各テストケース名は日本語 + AC-N 参照
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし（新規テスト含む）、既存テストが無修正で pass する（AC-01 / NFR-01）
- [ ] `src/cli/` / `package.scripts.fragment.json` / `profile-scripts.mjs` の diff がゼロである（INV-06 / SPEC-0051）
- [ ] `git diff --check` が pass する（trailing whitespace / 行末改行の混入なし — src-rules.md Intentional changes only）
- [ ] commit message に TASK-0227 を含める（commit-msg hook で強制）

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
