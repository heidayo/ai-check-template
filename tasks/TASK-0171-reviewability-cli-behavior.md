# TASK-0171: Reviewability CLI Behavior

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0171 |
| SPEC-ID   | SPEC-0045 |
| PLAN-ID   | PLAN-0045 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0170 |
| 見積     | 45m |

## 責務

`init` / `update` / `doctor` に reviewability templates の copy・repair・diagnostic behavior を追加する。

## 入力

- SPEC-0045
- TASK-0170 output
- Existing helpers: `copyTextFileSafe`, `updateTemplateFile`, `checkTemplateFile`

## 出力

- `init --review-templates` による reviewability template copy
- `update --review-templates` / install state default による repair
- `doctor --review-templates` / install state default による drift diagnostic

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `src/cli/init.mjs`
- 変更: `src/cli/update.mjs`
- 変更: `src/cli/doctor.mjs`
- 削除: なし

## 禁止事項

- `package-templates/.github/PULL_REQUEST_TEMPLATE.md` の本文を変更しない
- `package-templates/worksheet/ai-code-understanding.md` の本文を変更しない
- `doctor` で target project に書き込まない

## 完了条件

- [x] `init --review-templates` が PR template と worksheet を copy する
- [x] `update` が effective `reviewTemplates: true` のとき missing / managed drift を repair する
- [x] `doctor` が effective `reviewTemplates: true` のとき missing / drifted files を issue 化する

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0045-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0045-0171 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 19:12 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0171-reviewability-cli-behavior.md"
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
