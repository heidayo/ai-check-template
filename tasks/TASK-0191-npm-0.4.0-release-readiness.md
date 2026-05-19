# TASK-0191: npm 0.4.0 Release Readiness

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0191 |
| SPEC-ID   | SPEC-0054 |
| PLAN-ID   | PLAN-0054 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | none |
| 見積     | 1h |

## 責務

repository-current CLI を npm `0.4.0` release candidate として検証可能な状態にする。

## 入力

SPEC-0054、PLAN-0054、既存 release docs、package metadata、validation rules。

## 出力

version bump、v0.4.0 release notes、roadmap / README / CLI docs 更新、validation guard 更新、test 期待値更新。

## File Scope（変更許可範囲）

- 変更: `package.json`
- 変更: `README.md`
- 変更: `README-en.md`
- 変更: `docs/roadmap.md`
- 変更: `docs/cli.md`
- 作成: `docs/releases/v0.4.0.md`
- 変更: `package-templates/README.md`
- 変更: `Makefile`
- 変更: `tests/cli/init.test.mjs`
- 作成: `specs/SPEC-0054-npm-0.4.0-release-readiness.md`
- 作成: `plans/PLAN-0054-npm-0.4.0-release-readiness.md`
- 作成: `tasks/TASK-0191-npm-0.4.0-release-readiness.md`
- 削除: なし

## 禁止事項

- `npm publish` を実行しない
- git tag / GitHub Release を作成しない
- `run` / `expect` / security gate の runtime behavior を変更しない
- root `.claude` / `CLAUDE.md` を変更しない

## 完了条件

- [x] `node -p "require('./package.json').version"` が `0.4.0`
- [x] `npm test` が pass
- [x] `make validate` が pass
- [x] `git diff --check` が pass

## Done Definition（ラウンド単位）

本 TASK の完了条件と SPEC-0054 AC を Done Definition とする。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-19-task-0191 |
| 開始     | 2026-05-19 |
| 完了     | 2026-05-19 |
| 結果     | PASS |
| Gate結果  | structural: PASS / functional: PASS / security: PASS / architecture: PASS |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0191-npm-0.4.0-release-readiness.md"
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
