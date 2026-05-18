# TASK-0168: Security Scan Validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0168 |
| SPEC-ID   | SPEC-0044 |
| PLAN-ID   | PLAN-0044 |
| ステータス | Done |
| 担当Agent | Test |
| 並列可否  | No |
| 依存TASK  | TASK-0167 |
| 見積     | 25m |

## 責務

security-scan prompt が validation / package に含まれることを検証する。

## 入力

- TASK-0166 output
- TASK-0167 output

## 出力

- `Makefile`
- `tests/cli/package.test.mjs`

## File Scope（変更許可範囲）

- 変更: `Makefile`
- 変更: `tests/cli/package.test.mjs`
- 削除: なし

## 禁止事項

- security tool を本リポ validation で実行しない
- unrelated tests を変更しない

## 完了条件

- [x] `make validate-structure` が prompt の存在と重要文言を検証する
- [x] pack dry-run test が prompt inclusion を検証する

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0044-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0044-0168 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 00:00 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0168-security-scan-validation.md"
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
