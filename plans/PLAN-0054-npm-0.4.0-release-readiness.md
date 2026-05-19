# PLAN-0054: npm 0.4.0 Release Readiness

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0054 |
| SPEC-ID   | SPEC-0054 |
| ステータス | Completed |
| 作成日    | 2026-05-19 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] controller
- [ ] usecase
- [ ] domain
- [x] infrastructure
- [ ] frontend
- [x] infra
- [x] test
- [x] docs

## 影響範囲

- npm package metadata: `package.json`
- release docs: `docs/releases/v0.4.0.md`, `docs/roadmap.md`, `docs/cli.md`
- entry docs: `README.md`, `README-en.md`, `package-templates/README.md`
- validation guard: `Makefile`
- install state test: `tests/cli/init.test.mjs`

## 実装方針

`0.4.0` は publish-ready repository state として準備する。`package.json` を bump し、release notes と roadmap で「publish pending」を明示する。`Makefile` は package version、release notes、new CLI files を検証する。npm publish / tag / GitHub Release は TASK 外に残す。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0191 | 0.4.0 release readiness metadata/docs/tests を同期 | Implementation | 1h | none | No |

依存グラフ: `TASK-0191`

## リスク

- リスク1: published と release-ready の表現が混ざる → docs wording を publish pending に統一
- リスク2: Makefile が古い version を期待して validation 失敗 → version grep を `0.4.0` に更新
- リスク3: npm dry-run が registry state に依存する → 既存 `validate-npm-publish-dry-run` の branch logic を維持

## 必要な検証

- [x] unit/integration test: `npm test`
- [x] release validation: `make validate`
- [x] version check: `node -p "require('./package.json').version"`
- [x] docs check: `rg -n 'v0.4.0|0.4.0|publish pending|run|expect' README.md README-en.md docs/roadmap.md docs/cli.md docs/releases/v0.4.0.md`
- [x] architecture boundary check: File Scope diff review

## 自動採点

```yaml
eval_feedback:
  target_file: "plans/PLAN-0054-npm-0.4.0-release-readiness.md"
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
