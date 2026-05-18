# TASK-0162: Supabase RLS Doc Links

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0162 |
| SPEC-ID   | SPEC-0043 |
| PLAN-ID   | PLAN-0043 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0161 |
| 見積     | 25m |

## 責務

`supabase-rls` profile と prompt catalog から Supabase templates へ導線を追加する。

## 入力

- TASK-0161 outputs
- Existing `supabase-rls` profile
- Existing prompt catalog

## 出力

- `package-templates/profiles/supabase-rls/README.md`
- `package-templates/prompts/README.md`

## File Scope（変更許可範囲）

- 変更: `package-templates/profiles/supabase-rls/README.md`
- 変更: `package-templates/prompts/README.md`
- 削除: なし

## 禁止事項

- profile scripts の CLI behavior を変更しない
- root README をこの task で変更しない

## 完了条件

- [x] profile README に Supabase templates への導線がある
- [x] prompt README に RLS prompt と templates の組み合わせがある

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0043-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0043-0162 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 00:00 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0162-supabase-rls-doc-links.md"
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
