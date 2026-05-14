# TASK-0059: CLI validation wiring

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0059 |
| SPEC-ID   | SPEC-0015 |
| PLAN-ID   | PLAN-0015 |
| ステータス | Done |
| 担当Agent | Test |
| 並列可否  | No |
| 依存TASK  | TASK-0058 |
| 見積     | 35m |

## 責務

CLI tests を repository validation に接続し、SPEC-0015 AC を機械検証する。

## 入力

- `Makefile`
- `package.json`
- `tests/cli/init.test.mjs`
- SPEC-0015 AC-01..AC-14

## 出力

- `Makefile` validation update
- AC verification command results

## File Scope（変更許可範囲）

- 変更: `Makefile`
- 変更: `package.json`
- 変更: `specs/SPEC-0015-cli-init-foundation.md`
- 変更: `plans/PLAN-0015-cli-init-foundation.md`
- 変更: `tasks/TASK-0056-cli-package-skeleton.md`
- 変更: `tasks/TASK-0057-cli-init-operations.md`
- 変更: `tasks/TASK-0058-cli-tests-docs.md`
- 変更: `tasks/TASK-0059-cli-validation.md`
- 変更: `tasks/TASK-0060-verify-cli-init-foundation.md`
- 削除: なし

## 禁止事項

- validation を skip しない
- failing AC を Done 扱いしない
- File Scope 外の SAGE protected files を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `make validate` が CLI tests を実行して pass
- [x] `node bin/ai-check-template.mjs --help` が pass
- [x] `node --test tests/cli/*.test.mjs` が pass
- [x] `git diff --check` が pass
- [x] AC-01..AC-14 の機械検証結果を確認済み
- [x] TASK-0059 採点が 100/S++

## Tests

- `make validate`
- `node bin/ai-check-template.mjs --help`
- `node --test tests/cli/*.test.mjs`
- `git diff --check`
- `bash scripts/sage-validate.sh`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| `make validate` が CLI tests を実行しない | `Makefile` の validation target dependency を修正 |
| AC command failure | 対応 AC の implementation / docs / tests を修正し、該当 command を再実行 |
| SAGE validation failure | SPEC / PLAN / TASK の status, File Scope, required sections を修正 |

## Knowledge Management

Gate 誤検知または再発する validation gap があった場合は maintainer が `sage/failures.md` に記録し、必要に応じて `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

Validation は既存 `make validate` に CLI tests を追加するだけに留め、root CI の運用モデルを変えない。

## Done Definition

SPEC-0015 AC-01..AC-14 の local verification が pass。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0015-task-0059 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
