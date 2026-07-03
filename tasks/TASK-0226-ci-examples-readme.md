# TASK-0226: `package-templates/ci-examples/README.md` の monorepo / SARIF / SHA pin 参照節追記

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0226 |
| SPEC-ID   | SPEC-0062 |
| PLAN-ID   | PLAN-0062 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No（TASK-0225 の docs リンク先確定に依存） |
| 依存TASK  | TASK-0225 |
| 見積     | 1h |

## 責務

`package-templates/ci-examples/README.md`（利用者向け日本語ドキュメント）に、monorepo（paths filter / matrix / `--workspace` 接続）・SARIF opt-in の節を追記し、§7（version pin）に SHA pin 手順への `docs/github-actions.md` リンクとテンプレ内 third-party action の対象一覧を追記する（SPEC T4）。docs のリンク先（TASK-0225 で確定）を参照する。

## 入力

- SPEC-0062 FR-09、AC-08、実装メモ「言語規約」（README への追記は日本語）、リスク2、既存実装との衝突点（既存 §7「third-party action の version pin」の「方針のみ」記述を「手順リンク + 対象一覧」に拡充。他の既存節は変えない）
- 追記する 3 節（日本語）:
  1. **monorepo 節（FR-09）**: paths filter / matrix / SPEC-0061 の `--workspace` 接続の説明。reusable workflow の `working-directory` による workspace ディレクトリ運用例（既存 §3 の inputs 表と整合）。詳細手順は `docs/github-actions.md` へリンク
  2. **SARIF opt-in 節（FR-09）**: `ai-check.yml` の SARIF コメント雛形の有効化と `security-events: write` の必要性の概要。詳細は `docs/github-actions.md` へリンク
  3. **§7 SHA pin 参照（FR-09）**: 既存 §7 に SHA pin 具体手順への `docs/github-actions.md` リンクと、テンプレ内 third-party action の対象一覧（`actions/checkout` / `actions/setup-node` / `pnpm/action-setup` / `oven-sh/setup-bun` / `actions/upload-artifact` / `github/codeql-action`）を追記
- リンク先はすべて `docs/github-actions.md`（相対パスは既存 README のリンク記法 `../../docs/github-actions.md` に合わせる）。リンク先の該当節が TASK-0225 で存在することを前提とする（依存順序）
- リスク2 の告知: 「本更新で CI テンプレにコメント例が追加され、未改変利用者は update で自動追従（コメント増加のみ・active 挙動不変）、改変済みは skip-modified になる」旨を README または release note 相当箇所に記載してよい（FR-09 の範囲。README が適切な置き場）

## 出力

- `package-templates/ci-examples/README.md`（追記）: monorepo 節 / SARIF opt-in 節 / §7 SHA pin 参照（リンク + 対象一覧）

## File Scope（変更許可範囲）

- 変更: `package-templates/ci-examples/README.md`
- 作成: なし
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- 既存節（§1〜§6 / 思想 / どれを使うか等）の変更・削除の禁止 — §7 拡充 + monorepo / SARIF 節追加のみ（既存実装との衝突点。検出: レビューで既存節の diff 確認）
- `docs/github-actions.md` に存在しない節へのリンクの禁止 — TASK-0225 で確定したリンク先を参照する（依存順序。検出: リンク先の実在確認 + レビュー）
- SHA pin をテンプレ既定として強制する記述の禁止 — 既定は major pin（現行）を維持し SHA pin は docs 手順 + 雛形例で解禁（SEC-02。検出: レビュー）
- File Scope 外への変更の禁止 — 特に `docs/github-actions.md`（TASK-0225 の担当）/ CI テンプレ本体（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME 残留禁止

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol）
- [ ] AC-08: `ci-examples/README.md` に (a) monorepo（paths filter / matrix / `--workspace` 接続）、(b) SARIF opt-in、(c) §7 の SHA pin 手順参照、の 3 節が存在する（`grep` で monorepo・SARIF・SHA pin の各キーワードの存在を検証）
- [ ] リンク先が `docs/github-actions.md` であることをレビューで確認し、リンク先の該当節が実在する（TASK-0225 完了後）
- [ ] §7 にテンプレ内 third-party action の対象一覧がある（`actions/checkout` 等）
- [ ] 既存節（§1〜§6 等）の diff がゼロである（レビューで確認）
- [ ] リスク2 の update 挙動告知（未改変 auto-follow / 改変済み skip-modified）が README に記載されている
- [ ] `make validate` / `npm pack --dry-run`（または既存 preflight）が壊れない
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（README 変更が既存テストに影響しないこと = AC-01）
- [ ] commit message に TASK-0226 を含める（commit-msg hook で強制）

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
