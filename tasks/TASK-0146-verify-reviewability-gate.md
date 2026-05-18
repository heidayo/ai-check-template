# TASK-0146: Verify reviewability gate templates

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0146 |
| SPEC-ID   | SPEC-0039 |
| PLAN-ID   | PLAN-0039 |
| ステータス | Done |
| 担当Agent | Verify |
| 並列可否  | No |
| 依存TASK  | TASK-0142, TASK-0143, TASK-0144, TASK-0145 |
| 見積     | 30m |

## 責務

SPEC-0039 の AC-01..AC-08 を機械検証し、SPEC / PLAN / TASK status と採点欄を完了状態に更新して commit / push / PR を作成する。

## 入力

- SPEC-0039
- PLAN-0039
- TASK-0142..0145 outputs

## 出力

- 検証ログ
- 更新済み SAGE artifacts
- commit / branch / PR

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0039-reviewability-gate-templates.md`
- 変更: `plans/PLAN-0039-reviewability-gate-templates.md`
- 変更: `tasks/TASK-0142-reviewability-pr-template.md`
- 変更: `tasks/TASK-0143-reviewability-worksheet.md`
- 変更: `tasks/TASK-0144-reviewability-prompts.md`
- 変更: `tasks/TASK-0145-reviewability-docs-validation.md`
- 変更: `tasks/TASK-0146-verify-reviewability-gate.md`
- 削除: なし

## 禁止事項

- docs / validation files を追加修正しない
- failing validation を無視しない
- local-only research memo を commit しない
- npm publish / tag / release mutation を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] SPEC-0039 AC-01..AC-08 が全 pass
- [x] `node --test tests/cli/*.test.mjs` pass
- [x] `make validate` pass
- [x] `bash scripts/sage-validate.sh` pass
- [x] `git diff --check` pass
- [x] secret / private URL grep pass
- [x] File Scope / protected file / local-only memo untracked check pass
- [x] SPEC-0039 / PLAN-0039 / TASK-0142..0146 採点が 100/S++
- [x] commit message includes `TASK-0142 TASK-0143 TASK-0144 TASK-0145 TASK-0146`

## Tests

- `make validate-structure`
- `make validate-yaml`
- `node --test tests/cli/*.test.mjs`
- `make validate`
- `bash scripts/sage-validate.sh`
- `git diff --check`
- secret / private URL grep
- File Scope / protected scope check
- local-only memo untracked check

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| AC failure | 対応 TASK の File Scope 内で修正して再検証 |
| SAGE validation failure | SAGE artifact status / traceability を修正 |
| local memo tracked | unstage/remove tracked entry and keep `.local/` ignored |
| CI failure | same branch で修正し GitHub Actions を再確認 |

## Knowledge Management

検証で gate false positive があれば、maintainer が `sage/failures.md` に command, expected, actual, workaround を記録する。今回の TASK では `sage/**` は File Scope 外のため、必要な場合は follow-up として扱う。

## 段階採用

Reviewability templates を PR で安全に閉じ、CLI auto-copy / hook automation / Playwright stabilization は follow-up に残す。

## 採点

- TASK-0146: 100/S++

## Done Definition

PR が作成され、CI pass 後に auto-merge 可能な状態になっている。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0039-task-0146 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
