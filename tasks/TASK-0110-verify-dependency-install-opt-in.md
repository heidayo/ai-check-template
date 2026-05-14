# TASK-0110: Verify dependency install opt-in

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0110 |
| SPEC-ID   | SPEC-0029 |
| PLAN-ID   | PLAN-0029 |
| ステータス | Done |
| 担当Agent | Verify |
| 並列可否  | No |
| 依存TASK  | TASK-0107, TASK-0108, TASK-0109 |
| 見積     | 30m |

## 責務

SPEC-0029 の AC-01..AC-10 を機械検証し、SPEC / PLAN / TASK status と採点欄を完了状態に更新して commit / push / PR を作成する。

## 入力

- SPEC-0029
- PLAN-0029
- TASK-0107..TASK-0109
- CLI code / tests / docs diff

## 出力

- Updated SAGE statuses
- Verification results
- Git commit and PR

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0029-cli-dependency-install-opt-in.md`
- 変更: `plans/PLAN-0029-cli-dependency-install-opt-in.md`
- 変更: `tasks/TASK-0107-dependency-installer-core.md`
- 変更: `tasks/TASK-0108-dependency-installer-cli-integration.md`
- 変更: `tasks/TASK-0109-dependency-installer-tests-docs.md`
- 変更: `tasks/TASK-0110-verify-dependency-install-opt-in.md`
- 削除: なし

## 禁止事項

- implementation / docs files を追加修正しない
- failing validation を無視しない
- real dependency install を実行しない
- npm publish を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] SPEC-0029 AC-01..AC-10 が全 pass
- [x] `node --test tests/cli/*.test.mjs` pass
- [x] `make validate` pass
- [x] `bash scripts/sage-validate.sh` pass
- [x] `git diff --check` pass
- [x] secret pattern grep pass
- [x] File Scope / protected file check pass
- [x] SPEC-0029 / PLAN-0029 / TASK-0107..0110 採点が 100/S++
- [x] commit message includes `TASK-0107 TASK-0108 TASK-0109 TASK-0110`

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

dependency install を explicit opt-in に限定し、external toolchain install / registry publish は follow-up に残す。

## Done Definition

PR が作成され、CI pass 後に auto-merge 可能な状態になっている。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0029-task-0110 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
