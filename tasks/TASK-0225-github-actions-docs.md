# TASK-0225: `docs/github-actions.md` の SHA pin 手順・SARIF opt-in・monorepo 節追記

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0225 |
| SPEC-ID   | SPEC-0062 |
| PLAN-ID   | PLAN-0062 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No（TASK-0223 のテンプレ確定に依存。TASK-0224 とは互いに素な File Scope のため並列可だが安全側で直列運用推奨） |
| 依存TASK  | TASK-0223 |
| 見積     | 2h |

## 責務

`docs/github-actions.md` に、TASK-0222 / TASK-0223 で確定した SARIF opt-in / monorepo 例に対応する運用手順と、third-party action の SHA pin 具体手順を追記する（SPEC T3）。確定済みテンプレ挙動を文書化する（確定前の仕様を先に書かない）。

## 入力

- SPEC-0062 FR-08 / FR-09、SEC-01 / SEC-02、OPS-02 / OPS-03、AC-07、異常系5、実装メモ「docs SHA pin 手順」、リスク1、ASM-04、既存実装との衝突点（既存 §「Security and versioning」の `@v0.3.0` pin 説明は変えない）
- 追記する 3 ブロック（英語。既存 `docs/github-actions.md` / `cli.md` に合わせる — 言語規約）:
  1. **SHA pin 具体手順（FR-08 / SEC-02 / OPS-03）**: third-party action（`actions/checkout` / `actions/setup-node` / `pnpm/action-setup` / `oven-sh/setup-bun` / `actions/upload-artifact` / `github/codeql-action`）を表で示し、各々を `@v5` 等の major pin から `@<40桁 commit SHA> # v5` に変換する手順を書く。含める 4 点: (a) 対象 action 一覧、(b) `@<SHA> # vX` 形式の例、(c) SHA の調べ方（`gh api repos/<owner>/<repo>/git/refs/tags/<tag>` / GitHub UI の tag → commit）、(d) `@v0.3.0` タグ pin（本リポの hosted workflow / action 向け、既存 docs）との違い（それは「本リポの成果物を pin」、SHA pin は「テンプレ内の third-party action を pin」= 別レイヤ）の明記。tag が可変で同一 tag が別 commit を指しうる supply-chain の根拠（ASM-04 / SEC-02）と、`# vX` コメント併記による識別（異常系5）、Dependabot（`package-ecosystem: github-actions`）での自動 SHA 更新推奨（OPS-03）を含む
  2. **SARIF opt-in 有効化手順（FR-09 / SEC-01）**: `ai-check.yml` の SARIF コメント雛形を有効化する手順と `security-events: write` permission の必要性を書く。「SARIF upload には `security-events: write` が必須（付与漏れで upload が 403 fail = 異常系1）」「SARIF を使う job にのみ付与する least-privilege」「有効化時は Semgrep / `github/codeql-action` の公式ドキュメントで最新の入力を確認する」（リスク1）旨を含む
  3. **monorepo 運用の指針（FR-09 / OPS-02）**: paths filter / matrix / SPEC-0061 の `--workspace` 接続、および reusable workflow の `working-directory` input による workspace ディレクトリ運用例を書く。paths filter による required check 全スキップ回避（OPS-02。異常系2）の案内を含む
- 既存の `@v0.3.0` タグ pin 説明（既存 §「Security and versioning」/ Hosted reusable workflow 節）は変えず、third-party action SHA pin を別節として追加する（既存実装との衝突点）

## 出力

- `docs/github-actions.md`（追記）: SHA pin 具体手順節（対象 action 一覧表 + 4 点）、SARIF opt-in 節（`security-events: write` の必要性）、monorepo 節（paths filter / matrix / `--workspace` / `working-directory` + OPS-02 案内）

## File Scope（変更許可範囲）

- 変更: `docs/github-actions.md`
- 作成: なし
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- 既存の `@v0.3.0` タグ pin 説明を変更・削除することの禁止 — SHA pin は別節として追加（既存実装との衝突点。検出: レビューで既存節の diff 確認）
- 確定前のテンプレ仕様を docs に先書きすることの禁止 — TASK-0222 / TASK-0223 で確定した挙動のみ文書化（SPEC T3 依存順序。検出: 依存 TASK 完了確認）
- 検証済みでない外部 action / Semgrep フラグの手順記載の禁止 — SHA pin 例や SARIF 有効化手順に書く action バージョン / 入力名は公式ドキュメント照合済みであること（PRE-02 / src-rules.md AI Output Verification。検出: レビューで公式ドキュメント参照確認）
- `security-events: write` を SARIF 有効化と無関係に無条件で推奨することの禁止 — least-privilege を明記（SEC-01。検出: AC-07 のレビュー）
- File Scope 外への変更の禁止 — 特に `package-templates/ci-examples/README.md`（TASK-0226 の担当）（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME 残留禁止

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol）
- [ ] AC-07: `docs/github-actions.md` に third-party action の SHA pin 具体手順が存在し、4 点（対象 action 一覧 / `@<SHA> # vX` 形式の例 / SHA の調べ方 / `@v0.3.0` タグ pin との違い）が同節に含まれることをレビューで確認する（FR-08 / SEC-02）
- [ ] `grep` で `security-events: write` の記載と SHA pin 例（40 桁 hex または `# v` コメント併記の記述）の存在を検証できる（AC-07 / SEC-01）
- [ ] SARIF opt-in 有効化手順に「有効化時は Semgrep / codeql-action 公式ドキュメントで最新入力を確認する」旨がある（リスク1）
- [ ] monorepo 節に paths filter / matrix / `--workspace` 接続と OPS-02 の required check 全スキップ回避案内がある（FR-09 / OPS-02）
- [ ] Dependabot（`package-ecosystem: github-actions`）による SHA 自動更新推奨の記載がある（OPS-03）
- [ ] 既存の `@v0.3.0` タグ pin 説明の diff がゼロである（レビューで確認）
- [ ] `make validate` / `npm pack --dry-run`（または既存 preflight）が壊れない
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（docs 変更が既存テストに影響しないこと = AC-01）
- [ ] commit message に TASK-0225 を含める（commit-msg hook で強制）

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
