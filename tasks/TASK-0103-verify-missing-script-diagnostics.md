# TASK-0103: Verify missing script diagnostics

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0103 |
| SPEC-ID   | SPEC-0027 |
| PLAN-ID   | PLAN-0027 |
| ステータス | Done |
| 担当Agent | Verify |
| 並列可否  | No |
| 依存TASK  | TASK-0101, TASK-0102 |
| 見積     | 30m |

## 責務

SPEC-0027 の AC-01..AC-09 を機械検証し、SPEC / PLAN / TASK status と採点欄を完了状態に更新して commit / push / PR を作成する。

## 入力

- SPEC-0027
- PLAN-0027
- TASK-0101..TASK-0102
- CLI diagnostics / tests / docs diff

## 出力

- Updated SAGE statuses
- Verification results
- Git commit and PR

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0027-cli-missing-script-diagnostics.md`
- 変更: `plans/PLAN-0027-cli-missing-script-diagnostics.md`
- 変更: `tasks/TASK-0101-missing-script-diagnostics.md`
- 変更: `tasks/TASK-0102-missing-script-diagnostics-tests-docs.md`
- 変更: `tasks/TASK-0103-verify-missing-script-diagnostics.md`
- 削除: なし

## 禁止事項

- implementation / docs files を追加修正しない
- failing validation を無視しない
- npm publish を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] SPEC-0027 AC-01..AC-09 が全 pass
- [x] `node --test tests/cli/doctor.test.mjs` pass
- [x] `node --test tests/cli/*.test.mjs` pass
- [x] `make validate` pass
- [x] `bash scripts/sage-validate.sh` pass
- [x] `git diff --check` pass
- [x] secret pattern grep pass
- [x] File Scope / protected file check pass
- [x] SPEC-0027 / PLAN-0027 / TASK-0101..0103 採点が 100/S++
- [x] commit message includes `TASK-0101 TASK-0102 TASK-0103`

## Tests

- `node --test tests/cli/doctor.test.mjs`
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

missing script diagnostics を read-only warning に限定して閉じ、dependency install / script auto-creation は follow-up に残す。

## Done Definition

PR が作成され、CI pass 後に auto-merge 可能な状態になっている。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0027-task-0103 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
