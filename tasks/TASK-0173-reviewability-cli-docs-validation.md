# TASK-0173: Reviewability CLI Docs and Validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0173 |
| SPEC-ID   | SPEC-0045 |
| PLAN-ID   | PLAN-0045 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | TASK-0171 |
| 見積     | 35m |

## 責務

`--review-templates` の導入方法を docs / validation に反映し、manual-copy と CLI option の位置付けを明確にする。

## 入力

- SPEC-0045
- TASK-0171 output
- Existing CLI / usage docs

## 出力

- Updated README / CLI docs / usage model / package template README
- Updated Makefile structure validation

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/cli.md`
- 変更: `docs/usage-model.md`
- 変更: `package-templates/README.md`
- 変更: `Makefile`
- 削除: なし

## 禁止事項

- package version / release note を変更しない
- Reviewability template 本文を変更しない
- docs に gakuten 固有語を追加しない

## 完了条件

- [x] docs に `--review-templates` が記載される
- [x] docs が optional Review gate と manual-copy fallback を説明する
- [x] `make validate-structure` が pass する

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0045-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0045-0173 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 19:12 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0173-reviewability-cli-docs-validation.md"
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
