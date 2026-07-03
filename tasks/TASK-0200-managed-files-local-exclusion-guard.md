# TASK-0200: managed 一覧の local 系パス非包含回帰ガードテスト

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0200 |
| SPEC-ID   | SPEC-0057 |
| PLAN-ID   | PLAN-0057 |
| ステータス | Pending |
| 担当Agent | Test |
| 並列可否  | Yes（TASK-0199 / TASK-0201 と並列可） |
| 依存TASK  | なし |
| 見積     | 0.5h |

## 責務

`getManagedFiles()` の返す一覧が、いかなる profile / オプション組合せでも `ai-check.local.sh` および `.claude/rules/local/` 配下のパスを含まないことを検証する回帰ガードテストを常設する（FR-02 / AC-07 / INV-01、SPEC リスク3 / AP-03 / AP-06 対策）。

## 入力

- SPEC-0057 FR-02、AC-07、INV-01、Forbidden Shortcuts（managed 一覧への local 系パス追加禁止）
- `src/cli/managed-files.mjs` `getManagedFiles()`（`SCRIPT_FILES` 定数 3 scripts + claudeHooks 時 `test-rules.md` 追加の構造）
- 既存テストパターン: `tests/cli/managed-files.test.mjs`（TASK-0193 で作成済み）

## 出力

- 全 profile / オプション組合せ（claudeHooks 有無含む）を列挙して非包含を assert するテストケース（テストケース名は日本語 + AC-07 / INV-01 参照コメント）

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `tests/cli/managed-files.test.mjs`
- 削除: なし

## 禁止事項

- `src/cli/managed-files.mjs` 本体への変更禁止（SPEC File Scope: 本モジュールは変更しない）
- 一部の profile / オプション組合せのみで検証を済ませることの禁止（INV-01 は「いかなる組合せでも」が要件）
- 他 TASK 責務（scripts / init / docs）への越境禁止（AP-03）
- テストを通すためのテスト側修正の禁止（src-rules.md）、TODO/FIXME 残留禁止

## 完了条件

- [ ] AC-07: `getManagedFiles()` の全 profile / オプション組合せで `ai-check.local.sh` と `.claude/rules/local/` 配下パスの非包含テストがパスする（INV-01 / FR-02）
- [ ] `node --test tests/cli/managed-files.test.mjs` が全件パスする
- [ ] `git diff` に `src/cli/managed-files.mjs` の変更が含まれない
- [ ] 各テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0200 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0057-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
