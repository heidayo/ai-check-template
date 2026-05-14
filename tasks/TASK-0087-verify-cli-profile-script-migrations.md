# TASK-0087: Verify CLI profile script migrations

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0087 |
| SPEC-ID   | SPEC-0022 |
| PLAN-ID   | PLAN-0022 |
| ステータス | Done |
| 担当Agent | Verify |
| 並列可否  | No |
| 依存TASK  | TASK-0084, TASK-0085, TASK-0086 |
| 見積     | 35m |

## 責務

SPEC-0022 の AC-01..AC-11 を機械検証し、SPEC / PLAN / TASK status と採点欄を完了状態に更新して commit / push / PR を作成する。

## 入力

- SPEC-0022
- PLAN-0022
- TASK-0084..TASK-0086
- CLI code / tests / docs diff

## 出力

- Updated SAGE statuses
- Verification results
- Git commit and PR

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0022-cli-profile-script-migrations.md`
- 変更: `plans/PLAN-0022-cli-profile-script-migrations.md`
- 変更: `tasks/TASK-0084-profile-scripts-resolver.md`
- 変更: `tasks/TASK-0085-profile-script-cli-integration.md`
- 変更: `tasks/TASK-0086-profile-script-tests-docs.md`
- 変更: `tasks/TASK-0087-verify-cli-profile-script-migrations.md`
- 削除: なし

## 禁止事項

- implementation / docs files を追加修正しない
- failing validation を無視しない
- `--no-verify`, `--force`, `rm -rf` を使わない
- npm publish を実行しない

## 完了条件

- [x] SPEC-0022 AC-01..AC-11 が全 pass
- [x] `node --test tests/cli/*.test.mjs` pass
- [x] `npm pack --dry-run --json` pass
- [x] `make validate` pass
- [x] `bash scripts/sage-validate.sh` pass
- [x] `git diff --check` pass
- [x] secret pattern grep pass
- [x] File Scope / protected file check pass
- [x] SPEC-0022 / PLAN-0022 / TASK-0084..0087 採点が 100/S++
- [x] commit message includes `TASK-0084 TASK-0085 TASK-0086 TASK-0087`

## Tests

- `node --test tests/cli/*.test.mjs`
- `npm pack --dry-run --json`
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

profile script migrations を v0.2.0 alpha の package scripts surface に限定し、dependency install / package manager detection / shell script profile migration は follow-up に残す。

## Done Definition

PR が作成され、CI pass 後に auto-merge 可能な状態になっている。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0022-task-0087 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
