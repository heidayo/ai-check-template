# TASK-0161: Supabase RLS Manual Templates

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0161 |
| SPEC-ID   | SPEC-0043 |
| PLAN-ID   | PLAN-0043 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 45m |

## 責務

Supabase RLS の pgTAP / integration / Magic Link E2E manual-copy templates を追加する。

## 入力

- SPEC-0043
- PLAN-0043
- Supabase official testing docs

## 出力

- `package-templates/supabase/README.md`
- `package-templates/supabase/tests/database/rls_policy.test.sql`
- `package-templates/supabase/tests/rls/rls.integration.test.ts`
- `package-templates/supabase/tests/e2e/magic-link.spec.ts`

## File Scope（変更許可範囲）

- 作成: `package-templates/supabase/README.md`
- 作成: `package-templates/supabase/tests/database/rls_policy.test.sql`
- 作成: `package-templates/supabase/tests/rls/rls.integration.test.ts`
- 作成: `package-templates/supabase/tests/e2e/magic-link.spec.ts`
- 変更: なし
- 削除: なし

## 禁止事項

- 実 credential / JWT / email address を含めない
- `service_role` client を template 実装として使わない
- CLI 自動コピーを追加しない

## 完了条件

- [x] README が manual-copy 手順と `supabase test db` を含む
- [x] pgTAP SQL が許可 / 拒否ケースを含む
- [x] integration test が service-role bypass warning と user-token flow を含む
- [x] Magic Link E2E が local mail capture URL を env var で扱う

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0043-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0043-0161 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 00:00 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0161-supabase-rls-manual-templates.md"
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
