# TASK-0170: Reviewability Install State Options

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0170 |
| SPEC-ID   | SPEC-0045 |
| PLAN-ID   | PLAN-0045 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 35m |

## 責務

Reviewability template option の install state contract と top-level CLI help 表示を追加する。

## 入力

- SPEC-0045
- 既存 `--claude-hooks` install state / help pattern

## 出力

- `reviewTemplates` を保存・resolve・summary 出力できる install state
- `--review-templates` を表示する top-level CLI help

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `src/cli/install-state.mjs`
- 変更: `src/cli/index.mjs`
- 削除: なし

## 禁止事項

- install state schemaVersion を上げない
- credential / secret-like value を install state に追加しない
- `--claude-hooks` の既存 semantics を変更しない

## 完了条件

- [x] `reviewTemplates` が build / validate / resolve / summary に含まれる
- [x] old install state without `reviewTemplates` が `false` として normalize される
- [x] top-level help に `--review-templates` が表示される

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0045-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0045-0170 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 19:12 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0170-reviewability-install-state-options.md"
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
