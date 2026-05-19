# TASK-0190: First-Look Guidance Diagram

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0190 |
| SPEC-ID   | SPEC-0053 |
| PLAN-ID   | PLAN-0053 |
| ステータス | Done |
| 担当Agent | Documentation |
| 並列可否  | No |
| 依存TASK  | TASK-0189 |
| 見積     | 45m |

## 責務

GitHub初見導線として usage model と prompts README の関係を1枚絵で示す。

## 入力

SPEC-0053、PLAN-0053、既存 docs。

## 出力

Updated README / usage model / prompts README。

## File Scope（変更許可範囲）

- 変更: `docs/usage-model.md`
- 変更: `package-templates/prompts/README.md`
- 変更: `README.md`
- 変更: `README-en.md`
- 作成: `specs/SPEC-0053-first-look-guidance-diagram.md`
- 作成: `plans/PLAN-0053-first-look-guidance-diagram.md`
- 作成: `tasks/TASK-0190-first-look-guidance-diagram.md`
- 削除: なし

## 禁止事項

- repository directory restructure をしない
- image asset を追加しない
- specs/plans/tasks を移動しない

## 完了条件

- [x] `rg -n 'flowchart|plan-first.md|diagnostic-repair.md|security-scan.md|review-training.md' docs/usage-model.md` が pass
- [x] `make validate` が pass
- [x] `git diff --check` が pass

## Done Definition（ラウンド単位）

本 TASK の完了条件と SPEC-0053 AC を Done Definition とする。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-19-task-0190 |
| 開始     | 2026-05-19 |
| 完了     | 2026-05-19 |
| 結果     | PASS |
| Gate結果  | structural: PASS / functional: PASS / security: PASS / architecture: PASS |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0190-first-look-guidance-diagram.md"
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
