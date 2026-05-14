# TASK-0094: Managed workflow cleanup

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0094 |
| SPEC-ID   | SPEC-0025 |
| PLAN-ID   | PLAN-0025 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 35m |

## 責務

`update` に inactive exact-managed CI workflow cleanup を追加する。

## 入力

- `src/cli/update.mjs`
- SPEC-0025 FR-01..FR-06

## 出力

- `src/cli/update.mjs` updates

## File Scope（変更許可範囲）

- 変更: `src/cli/update.mjs`
- 削除: なし

## 禁止事項

- `init`, `doctor`, profile diagnostics, profile scripts を変更しない
- custom workflow を削除しない
- exact template match ではない workflow を削除しない
- `--dry-run` で target に書き込まない
- `package-templates/**` を変更しない
- destructive shell deletion commands を使わない

## 完了条件

- [x] inactive exact-managed CI files が cleanup 対象になる
- [x] dry-run は `would-delete` operation のみ出す
- [x] custom same-path workflow は `keep` される
- [x] selected CI mode workflow は維持される
- [x] TASK-0094 採点が 100/S++

## Tests

- `node --test tests/cli/update.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| cleanup missing | inactive CI file list を修正 |
| custom workflow removed | exact match helper を修正 |
| dry-run writes | dry-run branch を修正 |

## Knowledge Management

managed workflow cleanup regression が再発した場合、maintainer が command, ci mode, workflow path, expected operation, actual output を `sage/failures.md` に記録する。

## 段階採用

workflow cleanup は exact-managed file のみに限定し、package script cleanup は follow-up SPEC に残す。

## Done Definition

SPEC-0025 AC-02, AC-03, AC-04, AC-05, AC-06, AC-07 の implementation path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0025-task-0094 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
