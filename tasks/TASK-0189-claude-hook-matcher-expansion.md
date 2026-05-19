# TASK-0189: Claude Hook Matcher Expansion

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0189 |
| SPEC-ID   | SPEC-0052 |
| PLAN-ID   | PLAN-0052 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0188 |
| 見積     | 30m |

## 責務

Claude Code hook matcher に MultiEdit / NotebookEdit を追加する。

## 入力

SPEC-0052、PLAN-0052、existing hook fragment。

## 出力

Updated hook fragment, README, tests。

## File Scope（変更許可範囲）

- 変更: `package-templates/.claude/settings.hook-fragment.json`
- 変更: `package-templates/.claude/README.md`
- 変更: `tests/cli/init.test.mjs`
- 作成: `specs/SPEC-0052-claude-hook-matcher-expansion.md`
- 作成: `plans/PLAN-0052-claude-hook-matcher-expansion.md`
- 作成: `tasks/TASK-0189-claude-hook-matcher-expansion.md`
- 削除: なし

## 禁止事項

- hook command を変更しない
- Stop hook を変更しない
- blocking mode を再設計しない

## 完了条件

- [x] `rg -n 'MultiEdit|NotebookEdit' package-templates/.claude/settings.hook-fragment.json` が hit
- [x] `node --test tests/cli/init.test.mjs` が pass
- [x] `npm test` が pass

## Done Definition（ラウンド単位）

本 TASK の完了条件と SPEC-0052 AC を Done Definition とする。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-19-task-0189 |
| 開始     | 2026-05-19 |
| 完了     | 2026-05-19 |
| 結果     | PASS |
| Gate結果  | structural: PASS / functional: PASS / security: PASS / architecture: PASS |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0189-claude-hook-matcher-expansion.md"
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
