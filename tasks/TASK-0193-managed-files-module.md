# TASK-0193: managed ファイル列挙 + hash 計算の managed-files.mjs 集約

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0193 |
| SPEC-ID   | SPEC-0056 |
| PLAN-ID   | PLAN-0056 |
| ステータス | Pending |
| 担当Agent | Implementation / Test |
| 並列可否  | Yes（TASK-0194 と並列可） |
| 依存TASK  | none |
| 見積     | 1.5h |

## 責務

managed ファイル（shell scripts / CI workflow / Claude hooks・rules / review templates / profile docs）の列挙と SHA-256 hash 計算を新規 `src/cli/managed-files.mjs` に集約し、update / doctor / init がそこから import する構造にする（SPEC-0056 INV-03）。

## 入力

- SPEC-0056 スコープ（管理対象ファイル種別）、実装ルール（列挙の単一集約、`crypto.createHash("sha256")` のみ使用 — NFR-02）
- 既存の managed ファイル参照箇所: `src/cli/update.mjs` `updateTemplateFile()` / `updateRenderedTemplateFile()`、`src/cli/doctor.mjs` `checkExpectedFileContent()` / `checkTemplateFile()`、`src/cli/init.mjs` の copy 系関数

## 出力

- `src/cli/managed-files.mjs`（列挙 API + `hashContent()` 等の hash ユーティリティ）
- `tests/cli/managed-files.test.mjs`
- update / doctor / init が managed-files.mjs を import するリファクタ（挙動不変）

## File Scope（変更許可範囲）

- 作成: `src/cli/managed-files.mjs`, `tests/cli/managed-files.test.mjs`
- 変更: `src/cli/update.mjs`, `src/cli/doctor.mjs`, `src/cli/init.mjs`（import 差し替えのみ、判定ロジック変更禁止）
- 削除: なし

## 禁止事項

- 本タスクで 3-way 判定や hash 記録を実装しない（TASK-0195/0196 の責務 — AP-03 Silent Scope Expansion 禁止）
- managed ファイル一覧を `managed-files.mjs` 以外にハードコードしない（SPEC Forbidden Shortcuts）
- 外部依存の追加禁止（Node 標準 `crypto` のみ — NFR-02）
- `package-templates/` / `specs/` の変更禁止
- TODO/FIXME を残してコミットしない

## 完了条件

- [ ] `node --test tests/cli/managed-files.test.mjs` が全件パスする
- [ ] `grep -rn "managed" src/cli/update.mjs src/cli/doctor.mjs src/cli/init.mjs` で managed-files.mjs からの import 経由になっており、一覧のハードコードが残っていない（T1 完了条件の grep 検査）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（既存挙動不変 — AC-01）
- [ ] 各テストケースに検証対象の AC-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0193 を含める（commit-msg hook で強制）

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
