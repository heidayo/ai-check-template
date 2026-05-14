# TASK-0047: Verify test design template and diagnostic prompt

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0047 |
| SPEC-ID   | SPEC-0012 |
| PLAN-ID   | PLAN-0012 |
| ステータス | Done |
| 担当Agent | Test / Review |
| 並列可否  | No |
| 依存TASK  | TASK-0043, TASK-0044, TASK-0045, TASK-0046 |
| 見積     | 30m |

## Goal

SPEC-0012 AC-01..AC-13 を検証し、SAGE artifacts を完了状態に更新する。

## Scope

- AC-01..AC-13 の機械検証
- SAGE validation
- SPEC/PLAN/TASK status update
- final per-task scoring

## Non-goals

- PR 作成後の GitHub-hosted runner 結果の修正
- v0.1.0 release tag 作成

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0012-test-design-and-diagnostic-prompt.md`
- 変更: `plans/PLAN-0012-test-design-and-diagnostic-prompt.md`
- 変更: `tasks/TASK-0043-test-design-template.md`
- 変更: `tasks/TASK-0044-diagnostic-repair-prompt.md`
- 変更: `tasks/TASK-0045-template-catalog-updates.md`
- 変更: `tasks/TASK-0046-validation-for-test-design-template.md`
- 変更: `tasks/TASK-0047-verify-test-design-template.md`
- 作成/削除: なし

## 禁止事項

- AC 未完了のまま Done / Completed / Implemented にしない
- TASK 個別採点なしに final commit しない

## 完了条件

- [x] SPEC-0012 AC-01..AC-13 が全 pass
- [x] `make validate` が pass
- [x] `bash scripts/sage-validate.sh` が pass
- [x] `git diff --check` が pass
- [x] SPEC / PLAN / TASK / 各 TASK が 100/S++
- [x] TASK-0047 採点が 100/S++

## Tests

- `make validate`
- `bash scripts/sage-validate.sh`
- `git diff --check`
- SPEC-0012 AC commands

## Done Definition

SPEC-0012 全 AC + Gate 1..4 pass。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0012 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | Gate 1/2/3/4 PASS / TASK score 100/S++ |
