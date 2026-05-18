# TASK-0157: E2E Test Creation Prompt

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0157 |
| SPEC-ID   | SPEC-0042 |
| PLAN-ID   | PLAN-0042 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 30m |

## 責務

自然言語仕様から安定した Playwright E2E を作るための prompt template と catalog 導線を追加する。

## 入力

- SPEC-0042
- PLAN-0042
- 既存 `package-templates/prompts/` 構成

## 出力

- `package-templates/prompts/e2e-test-creation.md`
- `package-templates/prompts/README.md` の catalog 更新

## File Scope（変更許可範囲）

- 作成: `package-templates/prompts/e2e-test-creation.md`
- 変更: `package-templates/prompts/README.md`
- 削除: なし

## 禁止事項

- CSS / XPath を第一選択にする記述を入れない
- AC をテスト生成後に変更することを許可しない
- 実 credential や private URL を prompt 例に含めない

## 完了条件

- [x] prompt が locator priority、AC preservation、setup data、trace/report output を含む
- [x] prompt catalog に `e2e-test-creation.md` が登録される
- [x] `diagnostic-repair.md` との接続が明記される

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0042-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0042-0157 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 00:00 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0157-e2e-test-creation-prompt.md"
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
