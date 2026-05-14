# TASK-0091: Stale CI diagnostics

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0091 |
| SPEC-ID   | SPEC-0024 |
| PLAN-ID   | PLAN-0024 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 35m |

## 責務

`doctor` に inactive exact-managed CI workflow warning を追加する。

## 入力

- `src/cli/doctor.mjs`
- SPEC-0024 FR-01..FR-06

## 出力

- `src/cli/doctor.mjs` updates

## File Scope（変更許可範囲）

- 変更: `src/cli/doctor.mjs`
- 削除: なし

## 禁止事項

- `init`, `update`, profile diagnostics, profile scripts を変更しない
- stale workflow を削除しない
- default mode で warnings を failure にしない
- exact template match ではない workflow を warning にしない
- `package-templates/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] inactive exact-managed CI files が `ci-advice` warning になる
- [x] custom same-path workflow は warning にならない
- [x] selected CI mode の issues path は維持される
- [x] `doctor` は read-only のまま
- [x] TASK-0091 採点が 100/S++

## Tests

- `node --test tests/cli/doctor.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| stale warning missing | inactive CI file list を修正 |
| custom workflow false positive | exact match helper を修正 |
| selected CI issue regression | selected `checkCi` と warning scanner を分離 |

## Knowledge Management

stale CI diagnostic regression が再発した場合、maintainer が command, ci mode, workflow path, expected warning, actual output を `sage/failures.md` に記録する。

## 段階採用

stale managed workflow は advisory warning として導入し、cleanup / deletion は follow-up SPEC に残す。

## Done Definition

SPEC-0024 AC-02, AC-03, AC-04, AC-05, AC-06, AC-07 の implementation path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0024-task-0091 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
