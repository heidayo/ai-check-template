# TASK-0223: `ai-check.yml` / `ai-check-fast.yml` への monorepo paths filter / matrix opt-in コメント雛形追加

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0223 |
| SPEC-ID   | SPEC-0062 |
| PLAN-ID   | PLAN-0062 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No（TASK-0222 と同一 `ai-check.yml` に追記するため追記順序を固定する） |
| 依存TASK  | TASK-0222 |
| 見積     | 3h |

## 責務

`package-templates/ci-examples/github-actions/ai-check.yml` に monorepo 向けの **paths filter / matrix opt-in コメント雛形**を、`ai-check-fast.yml` に **paths filter opt-in コメント雛形のみ**を additive に追加する（SPEC T1b）。いずれも既定でコメントアウト（無効）で、コメント解除で有効化できる。SPEC-0061 の `--workspace` 対象ディレクトリに接続する書き方と、OPS-02 の required check 全スキップ回避案内を含む。追加コメントが `src/cli/ci-workflows.mjs` の PM 別置換と衝突しないことを担保する（原則無変更 = FR-05）。

## 入力

- SPEC-0062 FR-03 / FR-04 / FR-05、OPS-02、AC-01（paths/matrix 追加後の 4 PM × 2 file の YAML 妥当性・active 構造不変）/ AC-04（paths filter 例 + 案内 + matrix 例の存在）、異常系2 / 異常系3、境界ケース2、契約 (1)、実装メモ「paths filter 例」「matrix 例」「PM 別置換との非干渉」、リスク3 / リスク5、SPEC-0061 の `--workspace <pkg-dir>` 契約（PLAN-0062 実装方針 7 で整合確認済み）
- **paths filter 雛形**（`ai-check.yml` / `ai-check-fast.yml` の両方。すべてコメント化）: `on.pull_request.paths` / `on.push.paths` の雛形。SPEC-0061 の workspace 対象ディレクトリ（例: `packages/app`）に絞る場合は `paths: ['packages/app/**']` の書き方を示す。既定の `on:` トリガー（現行の全体起動）は変えない
- **OPS-02 案内**（paths filter とセットでコメント併記）: paths filter で「変更が対象外パスに限られる PR」が全 job スキップになると GitHub の required status check が never-run で pending のままマージブロックされる問題を明示し、回避策（常に成功する fallback job を required に指定する等の GitHub 標準手法）を案内する（異常系2。AC-04 で案内文存在を grep 検証）
- **matrix 雛形**（`ai-check.yml` のみ。コメント化）: `strategy.matrix` で複数 Node バージョン（例: `node: [20, 22]`、`node-version: ${{ matrix.node }}` に接続）または複数 workspace ディレクトリ（例: `workspace: [packages/app, packages/api]`、`working-directory: ${{ matrix.workspace }}` / SPEC-0061 の `--workspace` 相当のパスに接続）を回す雛形。`fail-fast: false` の考慮もコメントで触れる。既定の単一 job 構成は変えない
- 見出しコメント: `# --- monorepo: paths filter (opt-in) ---` / `# --- monorepo: matrix (opt-in) ---` の見出しで区切る（リスク5）。TASK-0222 の SARIF ブロックとは互いに素なブロックとして追記する
- PM 別置換との非干渉（FR-05 / 異常系3）: コメントに `pnpm ai:check` / `pnpm ai:check:fast` / `PNPM_SETUP_BLOCK`（`ci-workflows.mjs` L11-21）に一致する文字列を **置かない**。matrix 例で PM コマンドを書く場合は `${{ matrix.workspace }}` 等の変数を使い、リテラルの `pnpm ai:check` を避ける
- 言語規約: CI テンプレ内コメントは既存 `ai-check.yml` / `ai-check-fast.yml` の日本語コメントに合わせて日本語

## 出力

- `package-templates/ci-examples/github-actions/ai-check.yml`（追記）: monorepo paths filter 見出しブロック + matrix 見出しブロックをコメント化して追加。TASK-0222 の SARIF ブロックに続けて配置。active 行は不変
- `package-templates/ci-examples/github-actions/ai-check-fast.yml`（追記）: paths filter 見出しブロックのみコメント化して追加。SARIF / matrix は追加しない（FR-01 / 境界ケース1）。active 行は不変
- `src/cli/ci-workflows.mjs`（**原則無変更**）: 追加コメントが置換対象文字列を含まないことをレビューで確認。本 TASK の設計では差分ゼロが期待値

## File Scope（変更許可範囲）

- 変更: `package-templates/ci-examples/github-actions/ai-check.yml`, `package-templates/ci-examples/github-actions/ai-check-fast.yml`
- 変更（条件付き・原則無変更）: `src/cli/ci-workflows.mjs`
- 作成: なし
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- active な CI 挙動（トリガー・job 名・実行コマンド）を変更することの禁止 — paths / matrix はコメント雛形のみ。既定の `on:` トリガー・単一 job 構成は不変（NFR-01 / INV-01 / PRE-01。検出: TASK-0224 の AC-01 active 構造不変）
- コメント例に PM 別置換対象文字列（`pnpm ai:check` / `pnpm ai:check:fast` / `PNPM_SETUP_BLOCK`）を置くことの禁止（FR-05 / 異常系3。検出: TASK-0224 の AC-01 の 4 PM 描画 YAML 妥当性）
- SARIF / matrix を `ai-check-fast.yml` に追加することの禁止（FR-01 / 境界ケース1。fast には paths filter のみ。検出: TASK-0224 の AC-02 fast への SARIF 不在 + レビュー）
- `security:sast`（`semgrep scan --config auto`）を変更することの禁止（FR-02 / INV-02。検出: TASK-0224 の AC-03）
- hosted workflow（`ai-quality.yml`）/ Composite Action（`action.yml`）の contract 変更の禁止（INV-05 / SPEC-0040 継続。検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー）
- File Scope 外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME 残留禁止、npm 依存追加禁止（NFR-02）

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol）
- [ ] `ai-check.yml` / `ai-check-fast.yml` に paths filter 例（`paths:` を含むコメント雛形と workspace ディレクトリ glob 例）が存在する（FR-03 / AC-04）
- [ ] paths filter とセットで OPS-02 の「required check が全スキップで pending にならない工夫」への案内が同ファイルに存在する（異常系2 / AC-04。docs 側の案内は TASK-0225 で補完するが、テンプレ側にも grep 可能な案内文を置く）
- [ ] `ai-check.yml` に matrix 例（`strategy:` / `matrix:` を含むコメント雛形、`node: [20, 22]` または `workspace: [...]` と `node-version` / `working-directory` への接続、`fail-fast: false` 言及）が存在する（FR-04 / AC-04）
- [ ] `ai-check-fast.yml` に SARIF 要素 / matrix 例が存在しない（FR-01 / 境界ケース1。fast には paths filter のみ）
- [ ] `renderedCiWorkflow('ai-check.yml' | 'ai-check-fast.yml', pm)` の 4 PM 描画が YAML として妥当で、active な job 構造が本 TASK 適用前と同一である（手動 or `node --test` で確認。機械固定は TASK-0224 = AC-01）
- [ ] `src/cli/ci-workflows.mjs` の diff がゼロである（コメントが置換対象文字列を含まないため）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし、既存テストが無修正で pass する（AC-01 / NFR-01）
- [ ] `git diff --check` が pass する（trailing whitespace / 行末改行の混入なし）
- [ ] commit message に TASK-0223 を含める（commit-msg hook で強制）

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
