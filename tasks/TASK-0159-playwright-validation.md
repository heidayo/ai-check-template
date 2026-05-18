# TASK-0159: Playwright Validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0159 |
| SPEC-ID   | SPEC-0042 |
| PLAN-ID   | PLAN-0042 |
| ステータス | Done |
| 担当Agent | Test |
| 並列可否  | No |
| 依存TASK  | TASK-0156, TASK-0157, TASK-0158 |
| 見積     | 30m |

## 責務

新規 Playwright templates と prompt が package / validation に含まれることを機械検証する。

## 入力

- TASK-0156 outputs
- TASK-0157 outputs
- TASK-0158 outputs

## 出力

- `Makefile`
- `tests/cli/package.test.mjs`

## File Scope（変更許可範囲）

- 変更: `Makefile`
- 変更: `tests/cli/package.test.mjs`
- 削除: なし

## 禁止事項

- 実 Playwright browser install を本リポ validation に追加しない
- npm publish 設定を変更しない
- unrelated CLI tests を変更しない

## 完了条件

- [x] `make validate-structure` が新規 template / prompt の存在と重要文言を検証する
- [x] `npm pack --dry-run --json` test が新規 template / prompt の inclusion を検証する
- [x] `node --test tests/cli/*.test.mjs` が pass する

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0042-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0042-0159 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 00:00 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0159-playwright-validation.md"
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
