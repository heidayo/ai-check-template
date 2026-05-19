# TASK-0186: ai-check Structured Run

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0186 |
| SPEC-ID   | SPEC-0049 |
| PLAN-ID   | PLAN-0049 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | none |
| 見積     | 2h |

## 責務

`ai-check-template run` を追加し、`ai:check` command chain を構造化 evidence に変換する。

## 入力

SPEC-0049、PLAN-0049、既存 CLI dispatcher、既存 test fixture style。

## 出力

`src/cli/run.mjs`、dispatcher wiring、tests、docs。

## File Scope（変更許可範囲）

- 作成: `src/cli/run.mjs`
- 作成: `tests/cli/run.test.mjs`
- 変更: `src/cli/index.mjs`
- 変更: `tests/cli/package.test.mjs`
- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-en.md`
- 作成: `specs/SPEC-0049-ai-check-structured-run.md`
- 作成: `plans/PLAN-0049-ai-check-structured-run.md`
- 作成: `tasks/TASK-0186-ai-check-structured-run.md`
- 削除: なし

## 禁止事項

- `init` / `doctor` / `update` の既存挙動を破壊しない
- runtime dependency を追加しない
- secret-like output を raw JSON に残さない

## 完了条件

- [x] `node --test tests/cli/run.test.mjs` が pass
- [x] `npm test` が pass
- [x] `make validate` が pass

## Done Definition（ラウンド単位）

本 TASK の完了条件と SPEC-0049 AC を Done Definition とする。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-19-task-0186 |
| 開始     | 2026-05-19 |
| 完了     | 2026-05-19 |
| 結果     | PASS |
| Gate結果  | structural: PASS / functional: PASS / security: PASS / architecture: PASS |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0186-ai-check-structured-run.md"
  target_type: TASK
  verdict: PASS
  total_score: 100
  grade: "S++"
  subscores:
    codified_rules: "20/20"
    atomic_decomposition: "20/20"
    spec_driven_development: "20/20"
    observable_development: "20/20"
    knowledge_management: "15/15"
    gradual_adoption: "5/5"
  findings: []
  fix_instructions: []
```
