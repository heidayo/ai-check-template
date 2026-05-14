# TASK-0050: Dogfooding report validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0050 |
| SPEC-ID   | SPEC-0013 |
| PLAN-ID   | PLAN-0013 |
| ステータス | Done |
| 担当Agent | Implementation / Test |
| 並列可否  | No |
| 依存TASK  | TASK-0048, TASK-0049 |
| 見積     | 25m |

## Goal

`make validate` に initial dogfooding report の structural checks を追加する。

## Scope

- report file presence を検証する
- required headings / finding count / limitation / line count を検証する
- root docs links を検証する

## Non-goals

- dependency install
- external lint tool の追加
- GitHub Actions workflow 変更

## File Scope（変更許可範囲）

- 変更: `Makefile`
- 作成/削除: なし

## 禁止事項

- root CI で package install を必須にしない
- `sage/**` や `package-templates/scripts/**` を変更しない
- destructive command を入れない

## 完了条件

- [x] `make validate` が dogfooding report を検証する
- [x] `make validate` が pass
- [x] dependency install を実行しない
- [x] TASK-0050 採点が 100/S++

## Tests

- `grep -q "phase-1-initial-dogfooding-report.md" Makefile`
- `make validate`

## Done Definition

SPEC-0013 AC-07。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0013 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | Gate 1/2 PASS / TASK score 100/S++ |
