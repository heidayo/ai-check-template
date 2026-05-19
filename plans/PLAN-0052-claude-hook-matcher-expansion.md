# PLAN-0052: Claude Hook Matcher Expansion

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0052 |
| SPEC-ID   | SPEC-0052 |
| ステータス | Completed |
| 作成日    | 2026-05-19 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [ ] infrastructure
- [ ] frontend
- [x] infra
- [x] test
- [x] docs

## 影響範囲

- packaged Claude Code hook fragment
- `.claude` README
- init hook tests

## 実装方針

matcher string を拡張し、rendering logic は触らない。既存 merge/preserve behavior は tests の範囲で維持する。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0189 | Claude hook matcher と docs/tests を更新 | Implementation | 30m | TASK-0188 | No |

依存グラフ: `TASK-0188 -> TASK-0189`

## リスク

- リスク1: matcher typo → JSON fixture test で検出
- リスク2: custom hooks overwrite semantics 破壊 → existing tests を維持

## 必要な検証

- [x] unit test: `node --test tests/cli/init.test.mjs`
- [x] integration test: `npm test`
- [x] architecture boundary check: File Scope diff review

## 自動採点

```yaml
eval_feedback:
  target_file: "plans/PLAN-0052-claude-hook-matcher-expansion.md"
  target_type: PLAN
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
