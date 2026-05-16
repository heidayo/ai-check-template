# TASK-0128: Verify v0.2.0 stable release prep

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0128 |
| SPEC-ID   | SPEC-0034 |
| PLAN-ID   | PLAN-0034 |
| ステータス | Done |
| 担当Agent | Verify |
| 並列可否  | No |
| 依存TASK  | TASK-0126, TASK-0127 |
| 見積     | 30m |

## 責務

SPEC-0034 の AC-01..AC-09 を機械検証し、SPEC / PLAN / TASK status と採点欄を完了状態に更新して commit / push / PR を作成する。

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0034-v0.2.0-stable-release-prep.md`
- 変更: `plans/PLAN-0034-v0.2.0-stable-release-prep.md`
- 変更: `tasks/TASK-0126-v0.2.0-stable-metadata.md`
- 変更: `tasks/TASK-0127-v0.2.0-stable-docs.md`
- 変更: `tasks/TASK-0128-verify-v0.2.0-stable-release-prep.md`
- 削除: なし

## 禁止事項

- docs / metadata files を追加修正しない
- failing validation を無視しない
- actual `npm publish` を実行しない
- dist-tag mutation / tag push / GitHub Release creation を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] SPEC-0034 AC-01..AC-09 が全 pass
- [x] `node --test tests/cli/*.test.mjs` pass
- [x] `make validate` pass
- [x] `bash scripts/sage-validate.sh` pass
- [x] `git diff --check` pass
- [x] secret / auth material grep pass
- [x] File Scope / protected file check pass
- [x] SPEC-0034 / PLAN-0034 / TASK-0126..0128 採点が 100/S++
- [x] commit message includes `TASK-0126 TASK-0127 TASK-0128`

## Tests

- `npm publish --dry-run --tag latest --json`
- `node --test tests/cli/*.test.mjs`
- `make validate`
- `bash scripts/sage-validate.sh`
- `git diff --check`
- secret / auth material grep
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

stable release prep を PR で安全に閉じ、actual publish / tag / GitHub Release は maintainer 明示確認後に実行する。

## Done Definition

PR が作成され、CI pass 後に auto-merge 可能な状態になっている。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0034-task-0128 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
