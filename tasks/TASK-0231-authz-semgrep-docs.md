# TASK-0231: opt-in 適用手順 docs 追記 + 導線追記 + テスト追記

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0231 |
| SPEC-ID   | SPEC-0064 |
| PLAN-ID   | PLAN-0064 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No（TASK-0230 が作成した `tests/cli/supabase-semgrep-rules.test.mjs` に docs 検証ケースを追記するため直列） |
| 着手条件 | TASK-0230 が commit 済み（`authz-rules.yml` と `tests/cli/supabase-semgrep-rules.test.mjs` 作成後）であること — 同一テストファイルへの追記 + 確定した rule id / path を docs 化するため（PRE-01） |
| 依存TASK  | TASK-0230 |
| 見積     | 2h |

## 責務

TASK-0230 で確定したルール id・ファイルパス・opt-in コマンドを 3 docs に反映する（SPEC T2）。`package-templates/supabase/README.md` に「Semgrep ルール例」節を追加し opt-in 適用手順を記載、`package-templates/profiles/supabase-rls/README.md` にルール同梱 + opt-in 要約を追記、`package-templates/prompts/security-scan.md` に `authz-rules.yml` 追加適用出力の triage 対象化 + 出発点前提を追記する。あわせて TASK-0230 が作成した新規テストに opt-in 適用手順の存在 + 導線の docs 検証ケースを追記する。

## 入力

- SPEC-0064 FR-04 / FR-05 / FR-06、SEC-02 / SEC-03、NFR-01 / NFR-02、AC-04 / AC-05、異常系2 / 異常系3 / 異常系4、境界ケース1 / 境界ケース2、契約 (1) / (2) / (5) / (6)、実装メモ「README『Semgrep ルール例』節」「profile / prompt 追記」、リスク3 / リスク4 / リスク5、INV-01 / INV-02、PRE-01、POST-02
- `package-templates/supabase/README.md` の追記（英語ベースの既存ドキュメントのため英語 = 言語規約）: 既存「SQL identifier injection」節 / `service_role` 非使用注意書き（`Do not use service_role ...` 近傍）に「Semgrep ルール例」節を追加。(1)`security:sast` = `semgrep scan --config auto` が変わらないこと、(2)`semgrep scan --config auto --config ./supabase/semgrep/authz-rules.yml` の `--config` **追加**適用コマンド例、(3) ルールが「例（出発点）」で誤検知しうる旨、(4)`nosemgrep: <rule-id>` 抑制、(5)`prompts/security-scan.md` triage への導線を記載。既存 `service_role` 非使用注意書きと整合させ、削除・弱体化しない（FR-04 / SEC-02 / INV-01 / INV-02）
- `package-templates/profiles/supabase-rls/README.md` の追記（日本語ドキュメントのため日本語 = 言語規約）: 「Manual-copy templates」節付近に、addon が `supabase/semgrep/authz-rules.yml` を同梱し `--config` 追加で opt-in 適用する旨 + 要約を追記（FR-05）
- `package-templates/prompts/security-scan.md` の追記（英語で追記 = 言語規約）: 「When To Use」節付近に、`authz-rules.yml` を追加適用した Semgrep 出力も本 triage プロンプトの対象であり、ルールは出発点で誤検知しうる前提で triage する旨を追記。**既存 triage 本文（Redaction Rules / Findings 表 / decision 分類 fix now / false positive / suppress with owner+expiration / needs human review / Suppression Policy / 出力フォーマット）は不変**（FR-05 / 契約 (5) / 既存実装との衝突点）
- 既定 gate 不変の維持（INV-01 / SPEC-0051 / リスク3）: docs 追記で `security:sast` = `semgrep scan --config auto` が変わらないことを明記する。`package.scripts.fragment.json` / `profile-scripts.mjs` には触れない（触れたら「opt-in で追加」の前提が崩れた設計ミスとして立ち止まる）
- service_role 非使用の整合（SEC-02 / リスク4 / 異常系4）: README / prompt に service_role を使う経路の推奨・実値を混入させない。既存テンプレの anon key + user session 経路（「service-role bypass warning」）との整合を保つ
- secret 非混入（SEC-03）: docs 追記に実在の secret / token / 本番 URL / 本番 email を書かない。例示は非機密プレースホルダを維持
- 新規テスト（`tests/cli/supabase-semgrep-rules.test.mjs`）への docs 検証ケース追記設計: `supabase/README.md` を読み `--config` / `authz-rules.yml` / `config auto` / `nosemgrep` / `security-scan` の共存を grep（AC-04）。`profiles/supabase-rls/README.md` の `authz-rules.yml` / `--config` 記載、`prompts/security-scan.md` の `authz-rules.yml` / triage 該当キーワードを grep（AC-05）。読み取り + 静的アサートのみ。テストケース名は日本語 + AC-N 参照

## 出力

- `package-templates/supabase/README.md`（変更）: 「Semgrep ルール例」節を追加（opt-in 適用手順 5 要素 + 誤検知配慮 + `nosemgrep` + triage 導線）。既存 `service_role` 非使用注意書きは維持
- `package-templates/profiles/supabase-rls/README.md`（変更）: ルール同梱 + opt-in（`--config` 追加）要約の追記
- `package-templates/prompts/security-scan.md`（変更）: `authz-rules.yml` 追加適用出力の triage 対象化 + 出発点前提の追記。既存 triage 分類ロジック・出力フォーマットは不変
- `tests/cli/supabase-semgrep-rules.test.mjs`（**追記**）: opt-in 適用手順の存在（AC-04）+ 導線（AC-05）の検証ケースを TASK-0230 作成分に追記

## File Scope（変更許可範囲）

- 変更: `package-templates/supabase/README.md`
- 変更: `package-templates/profiles/supabase-rls/README.md`
- 変更: `package-templates/prompts/security-scan.md`
- 変更（追記）: `tests/cli/supabase-semgrep-rules.test.mjs`
- 作成: なし

## 禁止事項（Forbidden Shortcuts 転記）

- `security:sast`（`semgrep scan --config auto`）の変更・カスタムルールの既定 gate 強制組み込みの禁止 — docs には opt-in（`--config` 追加）と `config auto` 不変を明記する（検出: `package.scripts.fragment.json` / `profile-scripts.mjs` の無変更確認 + AC-04 の `config auto` 不変記載 — SPEC-0051 FR-02 / INV-01 保存 / 異常系3）
- `src/cli/` の変更の禁止 — ルール YAML は manual-copy のまま（検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー — INV-06）
- ルール YAML / README / prompt への `service_role` 使用の推奨・実値・実在 secret / 本番 URL / 本番 email の混入の禁止 — env 名は名前のみ、例示は非機密プレースホルダ（検出: AC-04 のレビュー + README / prompt の grep — SEC-02 / SEC-03 / INV-04 / 異常系4）
- 「例（出発点）であり網羅ではない」但し書きの省略の禁止 — README でルールを網羅的 authz チェックと誤解させない（検出: AC-04 の但し書き記載 — リスク5）
- `prompts/security-scan.md` の既存 triage 分類ロジック（fix now / false positive / suppress with owner+expiration / needs human review）・出力フォーマットの変更の禁止 — 追記は「When To Use」等への `authz-rules.yml` 対象化のみ（検出: レビュー — FR-05 / 契約 (5) / 既存実装との衝突点）
- `package-templates/ci-examples/` / SARIF 経路の変更の禁止（検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー — SPEC-0062 の範囲）
- `prompts/rls-permission.md` / `package-templates/supabase/tests/` テンプレ 3 種の変更の禁止（検出: File Scope 外 + レビュー — SPEC-0063 で確定済み）
- 新規 npm 依存（YAML パーサ・rule linter・semgrep devDependency）の追加の禁止（検出: `tests/cli/package.test.mjs` の dependencies 検査 + レビュー — NFR-02）
- File Scope 外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME を残してコミットすることの禁止（src-rules.md Forbidden shortcuts）
- commit message に TASK-0231 を含めないコミットの禁止（commit-msg hook で強制）

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol。ルール誤検知関連は症状欄冒頭に原因タグ『semgrep: authz ルール誤検知』を付し、既存 `cause` enum の該当値と併記する — OPS-01）
- [ ] `package-templates/supabase/README.md` に「Semgrep ルール例」節があり、(1)`security:sast` = `semgrep scan --config auto` 不変、(2)`--config ./supabase/semgrep/authz-rules.yml` 追加適用コマンド例、(3) ルールが「例（出発点）」で誤検知しうる旨、(4)`nosemgrep: <rule-id>` 抑制、(5)`prompts/security-scan.md` triage 導線が含まれる（`grep` で `--config` / `authz-rules.yml` / `config auto` / `nosemgrep` / `security-scan` の共存を検証 — AC-04 / FR-04 / INV-01 / INV-02）
- [ ] `supabase/README.md` の既存 `service_role` 非使用注意書きが維持され（削除・弱体化していない）、追記と整合している（レビュー — SEC-02 / リスク4 / 異常系4）
- [ ] `package-templates/profiles/supabase-rls/README.md` に `authz-rules.yml` 同梱 + opt-in（`--config` 追加）要約が追記されている（`grep` で `authz-rules.yml` / `--config` を検証 — AC-05 / FR-05）
- [ ] `package-templates/prompts/security-scan.md` に `authz-rules.yml` を追加適用した出力も triage 対象であり、ルールは出発点で誤検知しうる前提の記載が追記されている（`grep` で `authz-rules.yml` / triage 該当キーワードを検証 — AC-05 / FR-05）
- [ ] `prompts/security-scan.md` の既存 triage 分類ロジック（fix now / false positive / suppress with owner+expiration / needs human review）・出力フォーマットが無変更である（レビュー — FR-05 / 契約 (5)）
- [ ] docs 追記に `service_role` を使う経路の推奨・実値・実在 secret / 本番 URL / 本番 email が無い（`grep` + レビュー — SEC-02 / SEC-03）
- [ ] `tests/cli/supabase-semgrep-rules.test.mjs` に opt-in 適用手順の存在（AC-04）+ 導線（AC-05）の検証ケースを追記している。各テストケース名は日本語 + AC-N 参照
- [ ] `node --test tests/cli/supabase-semgrep-rules.test.mjs` が全件パスし、かつ `node --test tests/cli/*.test.mjs` が全件パスして既存テストが無修正で pass する（AC-04 / AC-05 / NFR-01）
- [ ] `src/cli/` / `package.scripts.fragment.json` / `profile-scripts.mjs` / `package-templates/ci-examples/` / `prompts/rls-permission.md` / `supabase/tests/` テンプレ 3 種の diff がゼロである（INV-01 / INV-06 / SPEC-0051 / SPEC-0062 / SPEC-0063）
- [ ] `git diff --check` が pass する（trailing whitespace / 行末改行の混入なし — src-rules.md Intentional changes only）
- [ ] `make validate` / `npm pack --dry-run`（または既存 preflight）が壊れない（docs 変更は既存 `package.json` `files` パターン内、`tests/cli/` は pack 非同梱）
- [ ] commit message に TASK-0231 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0064-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
