# TASK-0169: Verify Security Scan Prompt

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0169 |
| SPEC-ID   | SPEC-0044 |
| PLAN-ID   | PLAN-0044 |
| ステータス | Done |
| 担当Agent | Review |
| 並列可否  | No |
| 依存TASK  | TASK-0168 |
| 見積     | 25m |

## 責務

SPEC-0044 の AC を検証し、SAGE status を更新して commit / PR へ進める。

## 入力

- TASK-0166..0168 outputs
- SPEC-0044 acceptance criteria

## 出力

- Updated SAGE statuses
- Validation command results
- Commit and PR

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0044-security-scan-prompt-template.md`
- 変更: `plans/PLAN-0044-security-scan-prompt-template.md`
- 変更: `tasks/TASK-0166-security-scan-prompt.md`
- 変更: `tasks/TASK-0167-security-scan-doc-links.md`
- 変更: `tasks/TASK-0168-security-scan-validation.md`
- 変更: `tasks/TASK-0169-verify-security-scan-prompt.md`
- 削除: なし

## 禁止事項

- failing validation を無視しない
- `--no-verify` を使わない
- security finding の suppression を無根拠に推奨しない

## 完了条件

- [x] `make validate` が pass する
- [x] `bash scripts/sage-validate.sh` が pass する
- [x] `git diff --check` が pass する
- [x] File Scope check が pass する
- [x] secret-like pattern scan が pass する
- [x] TASK-ID を含む commit message を準備する

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0044-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0044-0169 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 00:00 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0169-verify-security-scan-prompt.md"
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
