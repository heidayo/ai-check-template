# TASK-0167: Security Scan Doc Links

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0167 |
| SPEC-ID   | SPEC-0044 |
| PLAN-ID   | PLAN-0044 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0166 |
| 見積     | 20m |

## 責務

Prompt catalog と usage model から security-scan prompt へ導線を追加する。

## 入力

- TASK-0166 output
- Existing prompt catalog
- Existing usage model

## 出力

- `package-templates/prompts/README.md`
- `docs/usage-model.md`

## File Scope（変更許可範囲）

- 変更: `package-templates/prompts/README.md`
- 変更: `docs/usage-model.md`
- 削除: なし

## 禁止事項

- CLI behavior を変更しない
- CI workflow を追加しない

## 完了条件

- [x] prompt catalog に `security-scan.md` が登録される
- [x] usage model に `ai:check:secure` と security prompt の接続がある

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0044-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0044-0167 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 00:00 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0167-security-scan-doc-links.md"
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
