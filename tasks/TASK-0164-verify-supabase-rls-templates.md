# TASK-0164: Verify Supabase RLS Templates

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0164 |
| SPEC-ID   | SPEC-0043 |
| PLAN-ID   | PLAN-0043 |
| ステータス | Done |
| 担当Agent | Review |
| 並列可否  | No |
| 依存TASK  | TASK-0163 |
| 見積     | 25m |

## 責務

SPEC-0043 の AC を検証し、SAGE status を完了状態に更新する。

## 入力

- TASK-0161..0163 outputs
- SPEC-0043 acceptance criteria

## 出力

- Updated SAGE statuses
- Validation command results

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0043-supabase-rls-testing-templates.md`
- 変更: `plans/PLAN-0043-supabase-rls-testing-templates.md`
- 変更: `tasks/TASK-0161-supabase-rls-manual-templates.md`
- 変更: `tasks/TASK-0162-supabase-rls-doc-links.md`
- 変更: `tasks/TASK-0163-supabase-rls-validation.md`
- 変更: `tasks/TASK-0164-verify-supabase-rls-templates.md`
- 変更: `tasks/TASK-0165-supabase-rls-pr.md`
- 削除: なし

## 禁止事項

- 検証未実行で Done にしない
- failure を握りつぶさない

## 完了条件

- [x] `make validate` が pass する
- [x] `bash scripts/sage-validate.sh` が pass する
- [x] `git diff --check` が pass する
- [x] File Scope check が pass する
- [x] secret-like pattern scan が pass する
- [x] SPEC / PLAN / TASK status が完了状態に更新される

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0043-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0043-0164 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 00:00 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0164-verify-supabase-rls-templates.md"
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
