# TASK-0067: Verify npm publish preflight

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0067 |
| SPEC-ID   | SPEC-0017 |
| PLAN-ID   | PLAN-0017 |
| ステータス | Done |
| 担当Agent | Review / Release |
| 並列可否  | No |
| 依存TASK  | TASK-0065, TASK-0066 |
| 見積     | 30m |

## 責務

SPEC-0017 の最終採点、ステータス更新、commit、push、PR 作成、自動マージ確認を実行する。

## 入力

- SPEC-0017 AC verification results
- PLAN-0017 / TASK-0065..0067 scoring results
- Repository hooks and GitHub CLI

## 出力

- SPEC / PLAN / TASK status updates
- commit with TASK IDs
- PR for `feature/npm-publish-preflight`

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0017-npm-publish-preflight.md`
- 変更: `plans/PLAN-0017-npm-publish-preflight.md`
- 変更: `tasks/TASK-0065-npm-publish-dry-run.md`
- 変更: `tasks/TASK-0066-npm-publish-preflight-docs.md`
- 変更: `tasks/TASK-0067-verify-npm-publish-preflight.md`
- 作成/削除: なし

## 禁止事項

- AC 未完了のまま PR を作成しない
- commit message から TASK-ID を省略しない
- CI 状態未確認で merge 済みと言わない
- actual `npm publish` を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] SPEC-0017 / PLAN-0017 / TASK-0065..0067 が 100/S++
- [x] TASK-0065..0067 のステータスが Done
- [x] PLAN-0017 が Completed
- [x] SPEC-0017 AC-01..AC-08 が pass
- [x] commit message に TASK-0065..0067 が含まれる
- [x] PR 本文が日本語で What / Why / Type / Verification / Risks を含む
- [x] TASK-0067 採点が 100/S++

## Tests

- `make validate`
- `npm publish --dry-run --tag next --json`
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

PR / CI / publish preflight handoff failure が再発する場合は maintainer が `sage/failures.md` に記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

PR は publish dry-run preflight のみを提出し、actual npm publish は explicit approval 後に残す。

## Done Definition

SPEC-0017 PR が作成され、CI / merge status を確認できる。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0017-task-0067 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
