# TASK-0122: Verify CI workflow package manager rendering

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0122 |
| SPEC-ID   | SPEC-0032 |
| PLAN-ID   | PLAN-0032 |
| ステータス | Done |
| 担当Agent | Verify |
| 並列可否  | No |
| 依存TASK  | TASK-0119, TASK-0120, TASK-0121 |
| 見積     | 30m |

## 責務

SPEC-0032 の AC-01..AC-13 を機械検証し、SPEC / PLAN / TASK status と採点欄を完了状態に更新して commit / push / PR を作成する。

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0032-cli-ci-workflow-package-manager.md`
- 変更: `plans/PLAN-0032-cli-ci-workflow-package-manager.md`
- 変更: `tasks/TASK-0119-ci-workflow-renderer.md`
- 変更: `tasks/TASK-0120-ci-workflow-cli-integration.md`
- 変更: `tasks/TASK-0121-ci-workflow-tests-docs.md`
- 変更: `tasks/TASK-0122-verify-ci-workflow-package-manager.md`
- 削除: なし

## 禁止事項

- implementation / docs files を追加修正しない
- failing validation を無視しない
- package templates を変更しない
- npm publish を実行しない
- real dependency install を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] SPEC-0032 AC-01..AC-13 が全 pass
- [x] `node --test tests/cli/*.test.mjs` pass
- [x] `make validate` pass
- [x] `bash scripts/sage-validate.sh` pass
- [x] `git diff --check` pass
- [x] secret pattern grep pass
- [x] File Scope / protected file check pass
- [x] SPEC-0032 / PLAN-0032 / TASK-0119..0122 採点が 100/S++
- [x] commit message includes `TASK-0119 TASK-0120 TASK-0121 TASK-0122`

## Tests

- `node --test tests/cli/*.test.mjs`
- `make validate`
- `bash scripts/sage-validate.sh`
- `git diff --check`
- secret pattern grep
- File Scope / protected scope check

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| AC failure | 対応 TASK の File Scope 内で修正して再検証 |
| SAGE validation failure | SAGE artifact status / traceability を修正 |
| CI failure | same branch で修正し GitHub Actions を再確認 |

## Knowledge Management

検証で gate false positive があれば、maintainer が `sage/failures.md` に command, expected, actual, workaround を記録する。今回の TASK では `sage/**` は File Scope 外のため、必要な場合は follow-up として扱う。

## 段階採用

CI workflow command rendering を runtime migration に限定し、actual npm publish は次の release operation に残す。

## Done Definition

PR が作成され、CI pass 後に auto-merge 可能な状態になっている。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0032-task-0122 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
