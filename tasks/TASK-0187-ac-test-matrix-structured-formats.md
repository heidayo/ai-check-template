# TASK-0187: AC Test Matrix Structured Formats

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0187 |
| SPEC-ID   | SPEC-0050 |
| PLAN-ID   | PLAN-0050 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0186 |
| 見積     | 2h |

## 責務

AC / Test Matrix の JSON/YAML templates と validation command を追加する。

## 入力

SPEC-0050、PLAN-0050、既存 `test-design-template.md`。

## 出力

Schema、examples、`expect` command、docs/tests。

## File Scope（変更許可範囲）

- 作成: `src/cli/expect.mjs`
- 作成: `tests/cli/expect.test.mjs`
- 作成: `package-templates/docs/ac-test-matrix.schema.json`
- 作成: `package-templates/docs/ac-test-matrix.example.json`
- 作成: `package-templates/docs/ac-test-matrix.example.yaml`
- 変更: `src/cli/index.mjs`
- 変更: `src/cli/profile-docs.mjs`
- 変更: `package-templates/docs/test-design-template.md`
- 変更: `package-templates/README.md`
- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-en.md`
- 作成: `specs/SPEC-0050-ac-test-matrix-structured-formats.md`
- 作成: `plans/PLAN-0050-ac-test-matrix-structured-formats.md`
- 作成: `tasks/TASK-0187-ac-test-matrix-structured-formats.md`
- 削除: なし

## 禁止事項

- 外部 YAML / JSON Schema runtime dependency を追加しない
- Markdown template の既存 sections を削除しない
- file content を eval しない

## 完了条件

- [x] `node --test tests/cli/expect.test.mjs` が pass
- [x] `npm test` が pass
- [x] `make validate` が pass

## Done Definition（ラウンド単位）

本 TASK の完了条件と SPEC-0050 AC を Done Definition とする。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-19-task-0187 |
| 開始     | 2026-05-19 |
| 完了     | 2026-05-19 |
| 結果     | PASS |
| Gate結果  | structural: PASS / functional: PASS / security: PASS / architecture: PASS |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0187-ac-test-matrix-structured-formats.md"
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
