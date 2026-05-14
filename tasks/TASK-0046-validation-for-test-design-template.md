# TASK-0046: Validation for test design template

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0046 |
| SPEC-ID   | SPEC-0012 |
| PLAN-ID   | PLAN-0012 |
| ステータス | Done |
| 担当Agent | Implementation / Test |
| 並列可否  | No |
| 依存TASK  | TASK-0043, TASK-0044 |
| 見積     | 30m |

## Goal

`make validate` に SPEC-0012 の新規配布物 structural checks を追加する。

## Scope

- new template / prompt の file presence を検証する
- required headings を grep する
- prompt README / package README links を grep する

## Non-goals

- dependency install
- external lint tool の追加
- GitHub Actions workflow 変更

## File Scope（変更許可範囲）

- 変更: `Makefile`
- 作成/削除: なし

## 禁止事項

- root CI で package install を必須にしない
- `package-templates/scripts/**` を変更しない
- shell command に destructive option を入れない

## 完了条件

- [x] `make validate` が new template / prompt を検証する
- [x] `make validate` が pass
- [x] dependency install を実行しない
- [x] TASK-0046 採点が 100/S++

## Tests

- `grep -q "test-design-template.md" Makefile`
- `grep -q "diagnostic-repair.md" Makefile`
- `make validate`

## Done Definition

SPEC-0012 AC-07。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0012 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | Gate 1/2 PASS / TASK score 100/S++ |
