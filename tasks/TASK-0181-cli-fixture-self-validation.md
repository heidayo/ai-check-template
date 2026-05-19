# TASK-0181: CLI Fixture Self Validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0181 |
| SPEC-ID   | SPEC-0047 |
| PLAN-ID   | PLAN-0047 |
| ステータス | Done |
| 担当Agent | Codex Test |
| 並列可否  | Yes |
| 依存TASK  | TASK-0179 |
| 見積     | 45m |

## 責務

CLI fixture lifecycle と root repository の自己検証入口を強化する。

## 入力

- SPEC-0047
- PLAN-0047
- `tests/cli/*.test.mjs`
- `package.json`
- `Makefile`

## 出力

- `init -> doctor -> update -> doctor --strict` に近い fixture lifecycle を検証する CLI test
- root repository validation の入口が `make validate` または `ai:check` alias として明確な状態
- 必要に応じた package / validation checks の更新

## File Scope（変更許可範囲）

- 作成: `tests/cli/release-readiness.test.mjs`
- 変更: `tests/cli/init.test.mjs`
- 変更: `tests/cli/doctor.test.mjs`
- 変更: `tests/cli/update.test.mjs`
- 変更: `tests/cli/package.test.mjs`
- 変更: `package.json`
- 変更: `Makefile`
- 削除: なし

## 禁止事項

- README / public docs を変更しない
- CLI runtime behavior を新機能として拡張しない
- npm publish / version bump を行わない
- Claude Code 固有ファイルを変更しない
- dependency install を必要とする重い fixture test にしない

## 完了条件

- [x] CLI fixture lifecycle test が `init`, `doctor`, `update`, `doctor --strict` の回帰を検出できる
- [x] root repository validation の入口が `package.json` scripts または Makefile / docs validation で明確である
- [x] `node --test tests/cli/*.test.mjs` が pass する
- [x] `make validate` が pass する
- [x] `git diff --check` が pass する

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0047-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-19-spec-0047-task-0181 |
| 開始     | 2026-05-19 |
| 完了     | 2026-05-19 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0181-cli-fixture-self-validation.md"
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
