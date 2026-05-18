# TASK-0151: Verify security split

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0151 |
| SPEC-ID   | SPEC-0040 |
| PLAN-ID   | PLAN-0040 |
| ステータス | Done |
| 担当Agent | Verify |
| 並列可否  | No |
| 依存TASK  | TASK-0147, TASK-0148, TASK-0149, TASK-0150 |
| 見積     | 30m |

## 責務

SPEC-0040 の AC-01..AC-08 を機械検証し、SPEC / PLAN / TASK status と採点欄を完了状態に更新して commit / push / PR を作成する。

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0040-security-split-check.md`
- 変更: `plans/PLAN-0040-security-split-check.md`
- 変更: `tasks/TASK-0147-security-script-template.md`
- 変更: `tasks/TASK-0148-security-cli-integration.md`
- 変更: `tasks/TASK-0149-security-docs-validation.md`
- 変更: `tasks/TASK-0150-security-tests.md`
- 変更: `tasks/TASK-0151-verify-security-split.md`
- 削除: なし

## 禁止事項

- implementation / docs / tests を追加修正しない
- failing validation を無視しない
- npm publish / tag / release mutation を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] SPEC-0040 AC-01..AC-08 が全 pass
- [x] `node --test tests/cli/*.test.mjs` pass
- [x] `make validate` pass
- [x] `bash scripts/sage-validate.sh` pass
- [x] `git diff --check` pass
- [x] secret / private URL grep pass
- [x] File Scope / protected file check pass
- [x] SPEC-0040 / PLAN-0040 / TASK-0147..0151 採点が 100/S++
- [x] commit message includes `TASK-0147 TASK-0148 TASK-0149 TASK-0150 TASK-0151`

## Tests

- `bash -n package-templates/scripts/ai-check-secure.sh`
- `node --test tests/cli/*.test.mjs`
- `make validate`
- `bash scripts/sage-validate.sh`
- `git diff --check`
- secret / private URL grep
- File Scope / protected scope check

## 採点

- TASK-0151: 100/S++

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0040-task-0151 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
