# TASK-0172: Reviewability CLI Tests

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0172 |
| SPEC-ID   | SPEC-0045 |
| PLAN-ID   | PLAN-0045 |
| ステータス | Done |
| 担当Agent | Test |
| 並列可否  | No |
| 依存TASK  | TASK-0171 |
| 見積     | 45m |

## 責務

Reviewability CLI option の copy / install state / update / doctor behavior を regression tests で固定する。

## 入力

- SPEC-0045
- TASK-0170..0171 outputs
- Existing CLI test helpers

## 出力

- Updated CLI tests covering `--review-templates`
- Old install state compatibility tests

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `tests/cli/init.test.mjs`
- 変更: `tests/cli/update.test.mjs`
- 変更: `tests/cli/doctor.test.mjs`
- 削除: なし

## 禁止事項

- production code を変更しない
- flaky timing / network dependency を tests に入れない
- target fixture 外の file を変更しない

## 完了条件

- [x] `node --test tests/cli/init.test.mjs` が pass する
- [x] `node --test tests/cli/update.test.mjs` が pass する
- [x] `node --test tests/cli/doctor.test.mjs` が pass する
- [x] `node --test tests/cli/*.test.mjs` が pass する

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0045-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0045-0172 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 19:12 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0172-reviewability-cli-tests.md"
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
