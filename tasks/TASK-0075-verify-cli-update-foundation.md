# TASK-0075: Verify CLI update foundation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0075 |
| SPEC-ID   | SPEC-0019 |
| PLAN-ID   | PLAN-0019 |
| ステータス | Done |
| 担当Agent | Review / Release |
| 並列可否  | No |
| 依存TASK  | TASK-0072, TASK-0073, TASK-0074 |
| 見積     | 30m |

## 責務

SPEC-0019 の最終採点、ステータス更新、commit、push、PR 作成、自動マージ確認を実行する。

## 入力

- SPEC-0019 AC verification results
- PLAN-0019 / TASK-0072..0075 scoring results
- Repository hooks and GitHub CLI

## 出力

- SPEC / PLAN / TASK status updates
- commit with TASK IDs
- PR for `feature/cli-update-foundation`

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0019-cli-update-foundation.md`
- 変更: `plans/PLAN-0019-cli-update-foundation.md`
- 変更: `tasks/TASK-0072-cli-update-command.md`
- 変更: `tasks/TASK-0073-cli-update-tests.md`
- 変更: `tasks/TASK-0074-cli-update-docs-validation.md`
- 変更: `tasks/TASK-0075-verify-cli-update-foundation.md`
- 作成/削除: なし

## 禁止事項

- AC 未完了のまま PR を作成しない
- commit message から TASK-ID を省略しない
- CI 状態未確認で merge 済みと言わない
- npm publish しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] SPEC-0019 / PLAN-0019 / TASK-0072..0075 が 100/S++
- [x] TASK-0072..0075 のステータスが Done
- [x] PLAN-0019 が Completed
- [x] SPEC-0019 AC-01..AC-12 が pass
- [x] commit message に TASK-0072..0075 が含まれる
- [x] PR 本文が日本語で What / Why / Type / Verification / Risks を含む
- [x] TASK-0075 採点が 100/S++

## Tests

- `make validate`
- `bash scripts/sage-validate.sh`
- `git status --short`
- `gh pr view --json url,state,mergeStateStatus`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| final scoring < 100 | findings を SPEC / PLAN / TASK の担当範囲に戻し、修正後に再採点 |
| PR creation failure | `gh auth status` と remote branch を確認し、commit / push 状態を修正 |
| CI failure | logs を確認し、同一 branch で修正 commit を追加して再実行 |

## Knowledge Management

PR / CI / update handoff failure が再発する場合は maintainer が `sage/failures.md` に記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

PR は update foundation のみを提出し、profile-aware migration は follow-up SPEC に残す。

## Done Definition

SPEC-0019 PR が作成され、CI / merge status を確認できる。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0019-task-0075 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
