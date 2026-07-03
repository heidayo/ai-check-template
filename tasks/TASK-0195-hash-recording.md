# TASK-0195: init / update 完了時の managed ファイル hash 記録

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0195 |
| SPEC-ID   | SPEC-0056 |
| PLAN-ID   | PLAN-0056 |
| ステータス | Pending |
| 担当Agent | Implementation / Test |
| 並列可否  | No |
| 依存TASK  | TASK-0193, TASK-0194 |
| 見積     | 1.5h |

## 責務

init / update 完了時に、書き込んだ全 managed ファイルの SHA-256 を install state `managedFiles` に記録する（FR-01 / INV-02）。dry-run 時は一切記録しない（INV-04）。

## 入力

- TASK-0193 の `src/cli/managed-files.mjs`（列挙 + hash API）、TASK-0194 の schema v2 state I/O
- `src/cli/init.mjs` `writeInitInstallState()`（L415）、`src/cli/update.mjs` `runUpdate()` の state 書き込みフロー

## 出力

- init / update 完了時に `managedFiles` hash を記録する実装
- AC-02 テスト（init 直後の state に `schemaVersion: 2` + 全 managed ファイルの hash）、dry-run 不変テスト（INV-04）

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `src/cli/init.mjs`, `src/cli/update.mjs`, `src/cli/install-state.mjs`（記録 API 追加が必要な場合のみ）, `tests/cli/init.test.mjs`, `tests/cli/update.test.mjs`
- 削除: なし

## 禁止事項

- 3-way 上書き判定の変更禁止（TASK-0196 の責務 — AP-03 / AP-02 Big Bang 禁止: 記録と判定を一括実装しない）
- dry-run でのファイルシステム / install state 変更の禁止（INV-04）
- managed 一覧を managed-files.mjs 以外から取得することの禁止（INV-03）
- `package-templates/` / `specs/` の変更禁止、TODO/FIXME 残留禁止

## 完了条件

- [ ] init 直後の `.ai-check-template.json` に `schemaVersion: 2` と全 managed ファイルの `managedFiles` hash が記録されるテストがパスする（AC-02 / T3 完了条件）
- [ ] 記録された各 hash が対応ファイルの実内容の SHA-256 と一致するテストがパスする（INV-02）
- [ ] dry-run 実行で install state が変更されないテストがパスする（INV-04 / FR-01）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01）
- [ ] 各テストケースに AC-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0195 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0056-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
