# PLAN-0051: Security Gate Expansion

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0051 |
| SPEC-ID   | SPEC-0051 |
| ステータス | Completed |
| 作成日    | 2026-05-19 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] controller
- [x] usecase
- [ ] domain
- [ ] infrastructure
- [ ] frontend
- [x] infra
- [x] test
- [x] docs

## 影響範囲

- profile script resolver
- init/update support script merge
- security docs and profile README snippets
- CLI tests expecting `ai:check:secure`

## 実装方針

`ai:check:secure` は package scripts の composition として残し、4つの named support scripts を追加する。scanner install は従来通り利用者責任にする。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0188 | security gate scripts/docs/tests を拡張 | Security Implementation | 2h | TASK-0187 | No |

依存グラフ: `TASK-0187 -> TASK-0188`

## リスク

- リスク1: tests の exact string が多数変わる → helpers/expected constants で更新する
- リスク2: Makefile structure grep が旧文言固定 → Semgrep string は `security:sast` 側に保持する
- リスク3: target projects の gate が重くなる → docs に customize guidance を追加する

## 必要な検証

- [x] unit/integration test: `npm test`
- [x] security scan: `security:*` scripts present
- [x] architecture boundary check: File Scope diff review

## 自動採点

```yaml
eval_feedback:
  target_file: "plans/PLAN-0051-security-gate-expansion.md"
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
