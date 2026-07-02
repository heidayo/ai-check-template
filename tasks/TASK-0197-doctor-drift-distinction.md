# TASK-0197: doctor の ok / drift-upstream / modified-local 区別表示

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0197 |
| SPEC-ID   | SPEC-0056 |
| PLAN-ID   | PLAN-0056 |
| ステータス | Pending |
| 担当Agent | Implementation / Test |
| 並列可否  | Yes（TASK-0196 と並列可） |
| 依存TASK  | TASK-0195 |
| 見積     | 1.5h |

## 責務

doctor の drift 報告を managed ファイルごとに `ok` / `drift-upstream`（更新未適用）/ `modified-local`（ユーザー改変）の 3 区別で表示し、install state の schemaVersion を出力に含める（FR-06 / OPS-02）。

## 入力

- SPEC-0056 FR-06 / OPS-02、異常系1（`managedFiles` 記録ありでファイル欠落 → doctor は警告）
- `src/cli/doctor.mjs` `checkExpectedFileContent()`（L318）/ `checkTemplateFile()`（L333）/ `diagnoseTarget()`（L211）
- TASK-0195 で記録される baseline hash（managed-files.mjs 経由で取得）

## 出力

- doctor の 3 区別判定 + schemaVersion 表示の実装
- 区別表示テスト（未改変 / upstream drift / ユーザー改変 / ファイル欠落警告の各ケース）

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `src/cli/doctor.mjs`, `tests/cli/doctor.test.mjs`
- 削除: なし

## 禁止事項

- update / init のロジック変更禁止（TASK-0195/0196 の責務 — AP-03）
- doctor でのファイル書き込み・修復動作の追加禁止（doctor は診断のみ）
- managed 一覧を managed-files.mjs 以外から取得することの禁止（INV-03）
- `doctor --strict` の exit code 仕様追加の禁止（別 SPEC 候補 A-3 — スコープ外）
- `package-templates/` / `specs/` の変更禁止、TODO/FIXME 残留禁止

## 完了条件

- [ ] doctor の ok / drift-upstream / modified-local を区別するテストが各状態 1 件以上ありパスする（FR-06 / T5 完了条件）
- [ ] `managedFiles` 記録ありでファイルが欠落しているケースで doctor が警告を出すテストがパスする（異常系1）
- [ ] doctor 出力に install state の schemaVersion が含まれるテストがパスする（OPS-02）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01 / AC-06）
- [ ] 各テストケースに AC-N / FR-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0197 を含める（commit-msg hook で強制）

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
