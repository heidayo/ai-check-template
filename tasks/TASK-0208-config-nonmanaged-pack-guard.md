# TASK-0208: config 非管理・非配布の回帰ガードテスト

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0208 |
| SPEC-ID   | SPEC-0058 |
| PLAN-ID   | PLAN-0058 |
| ステータス | Pending |
| 担当Agent | Test |
| 並列可否  | Yes（TASK-0206 / TASK-0207 と並列可） |
| 依存TASK  | なし |
| 見積     | 0.5h |

## 責務

`getManagedFiles()` の返す一覧が、いかなる profile / オプション組合せでも `.ai-check.yaml` / `.ai-check.json` を含まないことを検証する回帰ガードテスト（AC-08 / INV-01、SPEC リスク4 / AP-03 / AP-06 対策）と、npm pack 内容に config 実ファイルが含まれず `src/cli/check-config.mjs` が含まれること・`package.json` に runtime dependencies が無いことの検査（AC-09 / NFR-02）を常設する（SPEC T3）。

## 入力

- SPEC-0058 FR-08、AC-08 / AC-09、INV-01 / INV-06、NFR-02、Forbidden Shortcuts（managed 一覧への config パス追加禁止・実ファイル追加禁止・yaml 依存追加禁止）
- 既存テストパターン: `tests/cli/managed-files.test.mjs` の SPEC-0057 AC-07 非包含ガード（TASK-0200、同型で追記）、`tests/cli/package.test.mjs` の pack 内容検査
- `src/cli/managed-files.mjs` `getManagedFiles()`（本 TASK では変更しない）

## 出力

- 全 profile / オプション組合せ（claudeHooks 有無含む）で `.ai-check.yaml` / `.ai-check.json` 非包含を assert するテストケース（`tests/cli/managed-files.test.mjs` 追記）
- `npm pack --dry-run` 内容に `.ai-check.yaml` / `.ai-check.json` 実ファイルが含まれず `src/cli/check-config.mjs` が含まれること + `package.json` の `dependencies` が不在または空であることの検査（`tests/cli/package.test.mjs` 追記）
- テストケース名は日本語 + AC-N / INV-N 参照コメント

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `tests/cli/managed-files.test.mjs`, `tests/cli/package.test.mjs`
- 削除: なし

## 禁止事項

- `src/cli/managed-files.mjs` 本体への変更禁止（SPEC File Scope: 本モジュールは変更しない）
- 一部の profile / オプション組合せのみで検証を済ませることの禁止（INV-01 は「いかなる組合せでも」が要件）
- `.ai-check.yaml` / `.ai-check.json` という実ファイルのリポジトリ追加禁止（SPEC 実装ルール）
- 他 TASK 責務（check-config モジュール / run 統合 / docs）への越境禁止（AP-03）
- テストを通すためのテスト側修正の禁止（src-rules.md）、TODO/FIXME 残留禁止

## 完了条件

- [ ] 実装中に想定外エラーが発生した場合、`sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol）

- [ ] AC-08: `getManagedFiles()` の全 profile / オプション組合せで `.ai-check.yaml` / `.ai-check.json` の非包含テストがパスする（FR-08 / INV-01）
- [ ] AC-09: pack 内容に config 実ファイルが含まれず `src/cli/check-config.mjs` が含まれる検査がパスする（TASK-0206 完了前は check-config.mjs 存在検査のみ pending 扱いとし、マージ前に全体で green にする）
- [ ] NFR-02: `package.json` に `dependencies` フィールドが存在しない、または空であることの検査がパスする
- [ ] `node --test tests/cli/managed-files.test.mjs tests/cli/package.test.mjs` が全件パスする
- [ ] `git diff` に `src/cli/managed-files.mjs` の変更が含まれない
- [ ] 各テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0208 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0058-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
