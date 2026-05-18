# TASK-0166: Security Scan Prompt

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0166 |
| SPEC-ID   | SPEC-0044 |
| PLAN-ID   | PLAN-0044 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 30m |

## 責務

Security diagnostic output を AI に渡すための prompt template を追加する。

## 入力

- SPEC-0044
- PLAN-0044
- Semgrep / CodeQL official docs

## 出力

- `package-templates/prompts/security-scan.md`

## File Scope（変更許可範囲）

- 作成: `package-templates/prompts/security-scan.md`
- 変更: なし
- 削除: なし

## 禁止事項

- 実 secret / credential / private output を含めない
- Semgrep command を変更しない
- CodeQL workflow を追加しない

## 完了条件

- [x] prompt が redaction / evidence / triage / repair / re-check / suppression policy を含む
- [x] `ai:check:secure` と `semgrep scan --config auto` を含む

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0044-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0044-0166 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 00:00 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0166-security-scan-prompt.md"
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
