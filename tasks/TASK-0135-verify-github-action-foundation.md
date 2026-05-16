# TASK-0135: Verify GitHub Action foundation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0135 |
| SPEC-ID   | SPEC-0036 |
| PLAN-ID   | PLAN-0036 |
| ステータス | Done |
| 担当Agent | Verify |
| 並列可否  | No |
| 依存TASK  | TASK-0132, TASK-0133, TASK-0134 |
| 見積     | 30m |

## 責務

SPEC-0036 の AC-01..AC-09 を機械検証し、SPEC / PLAN / TASK status と採点欄を完了状態に更新して commit / push / PR を作成する。

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0036-v0.3.0-github-action-foundation.md`
- 変更: `plans/PLAN-0036-v0.3.0-github-action-foundation.md`
- 変更: `tasks/TASK-0132-hosted-reusable-workflow.md`
- 変更: `tasks/TASK-0133-composite-action-foundation.md`
- 変更: `tasks/TASK-0134-github-action-docs-validation.md`
- 変更: `tasks/TASK-0135-verify-github-action-foundation.md`
- 削除: なし

## 禁止事項

- implementation files を追加修正しない
- failing validation を無視しない
- release/tag/Marketplace operation を実行しない
- npm publish を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] SPEC-0036 AC-01..AC-09 が全 pass
- [x] `node --test tests/cli/*.test.mjs` pass
- [x] `make validate` pass
- [x] `bash scripts/sage-validate.sh` pass
- [x] `git diff --check` pass
- [x] secret / private URL grep pass
- [x] File Scope / protected file check pass
- [x] SPEC-0036 / PLAN-0036 / TASK-0132..0135 採点が 100/S++
- [x] commit message includes `TASK-0132 TASK-0133 TASK-0134 TASK-0135`

## Tests

- `make validate-yaml`
- `node --test tests/cli/*.test.mjs`
- `make validate`
- `bash scripts/sage-validate.sh`
- `git diff --check`
- secret / private URL grep
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

v0.3.0 foundation を PR で安全に閉じ、actual v0.3.0 release / Marketplace は follow-up に残す。

## Done Definition

PR が作成され、CI pass 後に auto-merge 可能な状態になっている。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0036-task-0135 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
