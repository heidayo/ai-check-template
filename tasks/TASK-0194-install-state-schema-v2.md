# TASK-0194: install state schema v2 化 + v1→v2 migration

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0194 |
| SPEC-ID   | SPEC-0056 |
| PLAN-ID   | PLAN-0056 |
| ステータス | Pending |
| 担当Agent | Implementation / Test |
| 並列可否  | Yes（TASK-0193 と並列可） |
| 依存TASK  | none |
| 見積     | 1.5h |

## 責務

`.ai-check-template.json` を schemaVersion 2（`managedFiles: { "<relative path>": { hash: "sha256:<hex>" } }`）に拡張し、v1 state の読み込み時自動 migration と schemaVersion > 2 のエラー停止を実装する（FR-05 / PRE-01 / POST-01）。

## 入力

- SPEC-0056 FR-04 / FR-05、異常系 2・3、既存実装との衝突点（`validateInstallState()` L156-220 の `schemaVersion !== INSTALL_STATE_SCHEMA_VERSION` 厳密一致を「1 または 2 を許容し、1 なら v2 へ migrate」に変更）
- `src/cli/install-state.mjs`: `INSTALL_STATE_SCHEMA_VERSION`（L13）、`buildInstallState()` / `loadInstallState()` / `writeInstallState()`

## 出力

- `src/cli/install-state.mjs` の schema v2 対応（validation 拡張、migration 関数、`managedFiles` フィールド）
- v1 state fixture を用いた migration テスト、schemaVersion>2 エラー停止テスト、JSON 破損 validation エラーテスト

## File Scope（変更許可範囲）

- 作成: なし（テストは既存ファイルに追記）
- 変更: `src/cli/install-state.mjs`, `tests/cli/update.test.mjs`（v1 fixture migration の integration テスト）または `tests/cli/init.test.mjs`
- 削除: なし

## 禁止事項

- schemaVersion > 2 の state を silent に読み進めることの禁止（明確なエラーで停止 — SPEC Forbidden Shortcuts / 異常系2）
- update / doctor / init の判定ロジック変更禁止（本タスクは state I/O 層のみ）
- 既存 v1 state の読み込みを invalid として弾く後方互換破壊の禁止（NFR-01）
- `package-templates/` / `specs/` の変更禁止、TODO/FIXME 残留禁止

## 完了条件

- [ ] v1 state fixture を読み込むテストが v2 への migration 成功を確認しパスする（T2 完了条件 / AC-05 の基盤）
- [ ] 異常系テストが明示的に存在しパスする: (a) schemaVersion 3 の state で明確なエラーメッセージで停止（異常系2）、(b) 破損 JSON で validation エラー停止 + init やり直し案内（異常系3）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01）
- [ ] 各テストケースに AC-N / FR-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0194 を含める（commit-msg hook で強制）

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
