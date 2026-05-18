# TASK-0156: Playwright Manual Templates

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0156 |
| SPEC-ID   | SPEC-0042 |
| PLAN-ID   | PLAN-0042 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 45m |

## 責務

Playwright の安定運用に必要な manual-copy template を追加する。

## 入力

- SPEC-0042
- PLAN-0042
- Playwright official best practices / locators / trace viewer / CI docs

## 出力

- `package-templates/playwright/README.md`
- `package-templates/playwright/playwright.config.ts`
- `package-templates/playwright/tests/smoke.spec.ts`

## File Scope（変更許可範囲）

- 作成: `package-templates/playwright/README.md`
- 作成: `package-templates/playwright/playwright.config.ts`
- 作成: `package-templates/playwright/tests/smoke.spec.ts`
- 変更: なし
- 削除: なし

## 禁止事項

- 実 credential / storageState / private URL を含めない
- app-specific 固有語を含めない
- root `.claude/` または `package-templates/.claude/` を変更しない
- CLI 自動コピーを追加しない

## 完了条件

- [x] README が manual-copy 手順、locator priority、trace artifact、MCP/CLI 役割分担を説明する
- [x] config が `baseURL`、`webServer`、`trace: "on-first-retry"`、CI retry、reporter を含む
- [x] smoke spec が `@smoke` と `getByRole` を含む

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0042-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0042-0156 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 00:00 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0156-playwright-manual-templates.md"
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
