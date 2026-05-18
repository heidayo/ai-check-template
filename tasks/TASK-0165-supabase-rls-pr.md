# TASK-0165: Supabase RLS PR

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0165 |
| SPEC-ID   | SPEC-0043 |
| PLAN-ID   | PLAN-0043 |
| ステータス | Done |
| 担当Agent | Review |
| 並列可否  | No |
| 依存TASK  | TASK-0164 |
| 見積     | 25m |

## 責務

TASK-ID 付き commit と PR body を準備し、CI 確認と自動 merge に進める状態にする。

## 入力

- Completed TASK-0161..0164
- Validation results

## 出力

- Commit
- PR
- CI result
- Merge result

## File Scope（変更許可範囲）

- 変更: `tasks/TASK-0165-supabase-rls-pr.md`
- 削除: なし

## 禁止事項

- `--no-verify` を使わない
- `--force` を使わない
- failing CI を merge しない

## 完了条件

- [x] commit message に `TASK-0161 TASK-0162 TASK-0163 TASK-0164 TASK-0165` を含める準備ができている
- [x] PR body に検証結果とレビュー観点を記載する準備ができている

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0043-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0043-0165 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 00:00 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0165-supabase-rls-pr.md"
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
