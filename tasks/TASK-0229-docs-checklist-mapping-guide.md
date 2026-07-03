# TASK-0229: ドキュメント更新（Checklist 簡素化 + マトリクス → テスト変数マッピングガイド）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0229 |
| SPEC-ID   | SPEC-0063 |
| PLAN-ID   | PLAN-0063 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No（TASK-0227 / TASK-0228 で確定した変数名・注入方法を文書化するため両者に依存） |
| 依存TASK  | TASK-0227, TASK-0228 |
| 見積     | 2h |

## 責務

TASK-0227 / TASK-0228 で確定した変数集約形テンプレを文書化する（SPEC T3）。`package-templates/supabase/README.md` の「Replacement Checklist」を「設定変数ブロック 1 箇所の編集 / env 注入」に簡素化し、`package-templates/profiles/supabase-rls/README.md` と `package-templates/prompts/rls-permission.md` に、`rls-permission.md` の権限マトリクスをテスト設定変数へ対応づけるマッピングガイドを追記する。

## 入力

- SPEC-0063 FR-06 / FR-07 / FR-08、SEC-02 / SEC-03、AC-05 / AC-06、境界ケース2、契約 (1) / (4)、実装メモ「README 簡素化」「profile / prompt 追記」、リスク5、INV-06、POST-02
- `supabase/README.md`（英語ベースの既存ドキュメント）の変更対象:
  - 「Replacement Checklist」節（現行 L56-71）を書き換える。現行の項目リスト（`app_items` / `owner_id` / `tenant_id` / UUID / `SUPABASE_URL` / `SUPABASE_ANON_KEY` / session / mail endpoint）を、「各ファイル冒頭の設定変数ブロックを 1 箇所編集、または対応する env var を注入」に置き換える
  - 変数名の対応表（テンプレ変数 ↔ env var ↔ 意味）を載せる。3 系統の編集/注入方法を明記: SQL（`\set table_name` default / `psql -v table_name=<name>`）・TS（`const TABLE = process.env.RLS_TABLE ?? "app_items"` default / `RLS_TABLE=<name>`）・Playwright（`process.env.SUPABASE_TEST_EMAIL` / `SUPABASE_LOCAL_MAIL_API_URL`）
  - SQL 識別子展開（`:"var"`）と値展開（`:'var'`）の使い分けを明記する（SEC-01）
  - `service_role` 非使用の段落（現行 L70-71）は**維持**する（SEC-02）
  - 「manual-copy ゆえ既存コピーは自動追従しない（update で新形式が降ってこない）。新形式は新規コピー分にのみ適用される」旨を 1 文追記する（FR-08 / INV-06 / 境界ケース2 / POST-02）
  - 追記は英語（既存ドキュメントに合わせる = 言語規約）
- `profiles/supabase-rls/README.md`（日本語ドキュメント）の変更対象:
  - 「Manual-copy templates」節（現行 L71-80）末尾に、テンプレが変数集約形（冒頭に設定変数ブロックを持つ）であること + `rls-permission.md` の権限マトリクス（role/resource/action）をテスト設定変数（テーブル・所有者列・ロール名・ポリシー名）へ対応づける手順を追記する
  - 追記は日本語（= 言語規約）
- `prompts/rls-permission.md`（日本語ドキュメント）の変更対象:
  - 「カスタマイズ」節（現行 L85-89）に、生成した権限マトリクスの role/resource/action を pgTAP（`\set` 変数）/ integration テスト（`const` 変数）の設定変数へ落とし込むマッピングガイドを追記する
  - **プロンプト本文 Step 1〜3（マトリクス生成ロジック、現行 L19-56 の `## 手順` / `## 出力形式`）は不変**（FR-07 / 契約 (4)。追記はガイド節のみ）
  - 追記は日本語（= 言語規約）
- secret 非混入（SEC-03）: 追記に実在の secret / token / 本番 URL / 本番 email を例示しない。UUID は `0000...0001` 系ダミー、URL は `127.0.0.1` 系ローカル、email は `.test` ドメインを維持する
- AC-05 / AC-06 の grep 期待: AC-05 は「変数名一覧」「`-v` / `process.env` の記載」「`service_role` 非使用注意書き残存」を検証。AC-06 は「設定変数」「マトリクス」等のキーワードとテンプレ参照の存在を検証し、`rls-permission.md` のマトリクス生成プロンプト本体無変更をレビュー確認

## 出力

- `package-templates/supabase/README.md`（変更）: Replacement Checklist が「設定変数ブロック 1 箇所編集 / env 注入」に簡素化。変数対応表 + 2 注入方法 + `:"var"`/`:'var'` 使い分け + `service_role` 非使用維持 + manual-copy 非追従性の 1 文
- `package-templates/profiles/supabase-rls/README.md`（変更）: 「Manual-copy templates」節にマトリクス → テスト変数マッピング手順を追記
- `package-templates/prompts/rls-permission.md`（変更）: 「カスタマイズ」節にマッピングガイド追記（プロンプト本文 Step 1〜3 不変）

## File Scope（変更許可範囲）

- 変更: `package-templates/supabase/README.md`
- 変更: `package-templates/profiles/supabase-rls/README.md`
- 変更: `package-templates/prompts/rls-permission.md`
- 作成: なし
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- `rls-permission.md` のマトリクス生成プロンプト本文（`## 手順` Step 1〜6 / `## 出力形式` Step 1〜3、現行 L19-56）の変更の禁止 — 追記は「カスタマイズ」節のガイドのみ（検出: AC-06 のレビューで prompt 本体無変更確認 — FR-07 / 契約 (4)）
- `service_role` 非使用注意書きの削除の禁止 — `supabase/README.md` の該当段落を維持（検出: AC-05 のレビュー + grep で残存確認 — SEC-02）
- 実在 secret / 本番 URL / 本番 email の例示混入の禁止 — 非機密ダミー（`0000...0001` / `127.0.0.1` / `.test`）を維持（検出: レビュー + docs grep — SEC-03）
- `src/cli/` の変更の禁止（検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー — INV-06）
- `security:sast`（`semgrep scan --config auto`）の変更の禁止（検出: `package.scripts.fragment.json` / `profile-scripts.mjs` の無変更確認 — SPEC-0051 保存）
- `docs/cli.md` / 他 profile README の変更の禁止 — CLI surface 不変（検出: File Scope 外 = レビュー — スコープ外節）
- manual-copy 非追従性を README に明記しないことの禁止 — 「既存コピーは自動追従しない」旨を必ず記載（検出: AC-05 のレビュー — FR-08 / INV-06）
- File Scope 外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME を残してコミットすることの禁止（src-rules.md Forbidden shortcuts）
- commit message に TASK-0229 を含めないコミットの禁止（commit-msg hook で強制）

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol。RLS 変数注入関連は症状欄冒頭に原因タグ『rls: 変数注入漏れ』を付す — OPS-01）
- [ ] `supabase/README.md` の Replacement Checklist が「設定変数ブロック 1 箇所編集 / env 注入」に簡素化され、SQL（`\set` / `-v`）・TS（`const` / `process.env`）・Playwright（`process.env`）の変数名一覧と 2 つの注入方法が記載されている（`grep` で変数名一覧・`-v` / `process.env` の記載を検証 — AC-05 / FR-06）
- [ ] `supabase/README.md` に `:"var"`（識別子展開）と `:'var'`（値展開）の使い分けが記載されている（SEC-01）
- [ ] `supabase/README.md` の `service_role` 非使用注意書きが残存している（`grep` + レビュー — AC-05 / SEC-02）
- [ ] `supabase/README.md` に「manual-copy ゆえ既存コピーは自動追従しない。新形式は新規コピー分にのみ適用される」旨が 1 文以上ある（AC-05 / FR-08 / INV-06 / 境界ケース2）
- [ ] `profiles/supabase-rls/README.md` と `prompts/rls-permission.md` に、権限マトリクス（role/resource/action）をテスト設定変数（テーブル・所有者列・ロール名・ポリシー名）へ対応づけるガイドが存在する（`grep` で「設定変数」「マトリクス」等のキーワードとテンプレ参照の存在を検証 — AC-06 / FR-07）
- [ ] `prompts/rls-permission.md` のマトリクス生成プロンプト本体（`## 手順` / `## 出力形式` Step 1〜3、現行 L19-56）が無変更である（レビューで確認 — AC-06 / FR-07 / 契約 (4)）
- [ ] 追記に実在 secret / 本番 URL / 本番 email が含まれない（非機密ダミー維持 — SEC-03）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-05 / AC-06 の docs grep 検証を含む。既存 preflight（`npm pack --dry-run` 等）が壊れない — NFR-01）
- [ ] `src/cli/` / `package.scripts.fragment.json` / `profile-scripts.mjs` / `docs/cli.md` の diff がゼロである（INV-06 / SPEC-0051 / スコープ外節）
- [ ] `git diff --check` が pass する（trailing whitespace / 行末改行の混入なし — src-rules.md Intentional changes only）
- [ ] commit message に TASK-0229 を含める（commit-msg hook で強制）

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
