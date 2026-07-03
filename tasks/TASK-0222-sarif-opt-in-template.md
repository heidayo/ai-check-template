# TASK-0222: `ai-check.yml` への Semgrep SARIF opt-in コメント雛形追加

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0222 |
| SPEC-ID   | SPEC-0062 |
| PLAN-ID   | PLAN-0062 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No（TASK-0223 が同一 `ai-check.yml` に追記するため追記順序を固定する） |
| 依存TASK  | なし |
| 見積     | 3h |

## 責務

`package-templates/ci-examples/github-actions/ai-check.yml` の末尾に、Semgrep SARIF を GitHub Code Scanning に載せる **opt-in コメント雛形**を additive に追加する（SPEC T1a）。雛形は既定でコメントアウト（無効）で、コメント解除のみで有効化できる。あわせて追加コメントが `src/cli/ci-workflows.mjs` の PM 別置換と衝突しないことを担保する（`ci-workflows.mjs` は原則無変更 = FR-05）。

## 入力

- SPEC-0062 FR-01 / FR-02 / FR-05、SEC-01 / SEC-03、PRE-02、INV-04、AC-01（SARIF 追加後の 4 PM × `ai-check.yml` の YAML 妥当性・active 構造不変）/ AC-02（SARIF 3 要素存在）、異常系1 / 異常系3、境界ケース2、契約 (1)、実装メモ「SARIF 雛形の置き場」「SARIF ステップの中身」「PM 別置換との非干渉」、リスク1 / リスク4 / リスク5
- SARIF 雛形の 3 要素（すべてコメント化。既定無効）:
  1. **scan ステップ**: `semgrep scan --sarif --output=semgrep.sarif --config auto` を走らせる（package script `security:sast` の `--config auto` と同 config を使うが、CI では `--sarif --output` を足した別呼び出し。`pnpm security:sast` / `ai:check:secure` を呼ばない — FR-02）。`semgrep` の install（`pip install semgrep` 等）はコメントで案内するがステップ本体には含めない（scanner 自動 install しない — スコープ外節）
  2. **upload ステップ**: `uses: github/codeql-action/upload-sarif@<pin>` with `sarif_file: semgrep.sarif`（`sarif_file` 入力名とバージョンは公式ドキュメント照合で確定 — PRE-02 / リスク1）
  3. **permission**: workflow 冒頭の既存 `permissions: contents: read` に対し「SARIF を使う場合の追記例」として `#   security-events: write` をコメントで併記する（既存 permission ブロックの active 行は変えない）。SARIF を使う job / step にスコープした最小権限を第一に示す（SEC-01 / INV-04 / リスク4）
- 見出しコメント: 既存末尾コメント（Playwright artifact / diagnostic logs 例）と同じスタイルで `# --- Semgrep SARIF (opt-in) ---` の見出し + FR-02 の理由コメント（「package script は `--config auto`、CI SARIF は `--sarif` で別途出力」）を付す
- SEC-03 注意書き: 「SARIF は public repo では Security タブ経由で閲覧範囲が決まる。finding にパスや周辺コードが含まれる点に留意（secret / private value を CI ログ / SARIF に載せない判断を利用者が行う）」旨をコメントに含める
- PM 別置換との非干渉（FR-05 / 異常系3）: SARIF コメントに `pnpm ai:check` / `pnpm ai:check:fast` / `PNPM_SETUP_BLOCK`（`ci-workflows.mjs` L11-21）に一致する文字列を **置かない**。Semgrep コマンドは PM 非依存（`semgrep scan ...`）なので置換対象にならず安全
- 言語規約: CI テンプレ内コメントは既存 `ai-check.yml` の日本語コメントに合わせて日本語

## 出力

- `package-templates/ci-examples/github-actions/ai-check.yml`（追記）: `# --- Semgrep SARIF (opt-in) ---` 見出しブロック + scan / upload-sarif / permission の 3 要素をコメント化して末尾に追加。active な `on:` / `permissions:` / `jobs:` の行は不変
- `src/cli/ci-workflows.mjs`（**原則無変更**）: 追加コメントが置換対象文字列を含まないことをレビューで確認。含めざるを得ない場合のみ最小変更で対応し 4 PM 描画の YAML 妥当性を確認（本 TASK の設計では差分ゼロが期待値）

## File Scope（変更許可範囲）

- 変更: `package-templates/ci-examples/github-actions/ai-check.yml`
- 変更（条件付き・原則無変更）: `src/cli/ci-workflows.mjs`
- 作成: なし
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- `security:sast`（`semgrep scan --config auto`）を変更することの禁止 — SARIF は CI 側の別経路（`--sarif --output`）。`src/cli/profile-scripts.mjs` に触れたら設計を疑う（FR-02 / INV-02 / SPEC-0051 FR-02。検出: TASK-0224 の AC-03）
- active な CI 挙動（トリガー・job 名・実行コマンド・既存 permission の active 行）を変更することの禁止 — SARIF はコメント雛形のみ（NFR-01 / INV-01 / PRE-01。検出: TASK-0224 の AC-01 active 構造不変）
- SARIF コメント例に PM 別置換対象文字列（`pnpm ai:check` / `pnpm ai:check:fast` / `PNPM_SETUP_BLOCK`）を置くことの禁止（FR-05 / 異常系3。検出: TASK-0224 の AC-01 の 4 PM 描画 YAML 妥当性）
- SARIF を `ai-check-fast.yml` に追加することの禁止（FR-01 / 境界ケース1。本 TASK は `ai-check.yml` のみ。検出: TASK-0224 の AC-02 fast への SARIF 不在）
- 検証済みでない外部 action / Semgrep フラグ（実ドキュメント未照合の `upload-sarif` 入力・`--sarif` 構文等）のコミットの禁止（PRE-02 / src-rules.md AI Output Verification。検出: レビューで公式ドキュメント参照確認）
- `security-events: write` を SARIF 有効化と無関係に無条件で広げることの禁止 — SARIF ブロックとセットでコメント化する（SEC-01 / INV-04。検出: レビュー + TASK-0224 の AC-02 permission 雛形存在）
- hosted workflow（`ai-quality.yml`）/ Composite Action（`action.yml`）の contract 変更の禁止（INV-05 / SPEC-0040 継続。検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー）
- File Scope 外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME 残留禁止、npm 依存追加禁止（NFR-02）

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol。SARIF 関連は症状欄冒頭に原因タグ『sarif: 有効化失敗』を付す — OPS-01）
- [ ] `ai-check.yml` に SARIF opt-in の 3 要素がコメントで存在する — (a) `semgrep scan --sarif` を含む scan ステップ、(b) `github/codeql-action/upload-sarif` の upload ステップ、(c) `security-events: write` の permission（FR-01 / AC-02）
- [ ] SARIF ステップが `pnpm security:sast` / `ai:check:secure` を呼ばず、`semgrep scan --sarif --output ... --config auto` の別経路である（FR-02）
- [ ] `github/codeql-action/upload-sarif` の `sarif_file` 入力とバージョン、Semgrep `--sarif --output` 構文を公式ドキュメントと照合し、照合した version / 入力名を雛形コメントに残している（PRE-02 / リスク1 / src-rules.md AI Output Verification）
- [ ] `security-events: write` が SARIF ブロックとセットでコメント化され、既定の `contents: read` の active 行は変わっていない（SEC-01 / INV-04）
- [ ] SEC-03 の secret 非混入の注意書きがコメントに存在する
- [ ] `renderedCiWorkflow('ai-check.yml', pm)` の 4 PM（pnpm / npm / yarn / bun）描画が YAML として妥当で、active な job 構造（step 列・実行コマンド）が本 TASK 適用前と同一である（手動 or `node --test` で確認。機械固定は TASK-0224 = AC-01）
- [ ] `src/cli/ci-workflows.mjs` の diff がゼロである（SARIF コメントが置換対象文字列を含まないため。含めた場合は設計を疑い最小変更に留める）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし、既存テストが無修正で pass する（AC-01 / NFR-01）
- [ ] `git diff --check` が pass する（trailing whitespace / 行末改行の混入なし — src-rules.md Intentional changes only）
- [ ] commit message に TASK-0222 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0062-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
