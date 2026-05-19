# PLAN-0050: AC Test Matrix Structured Formats

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0050 |
| SPEC-ID   | SPEC-0050 |
| ステータス | Completed |
| 作成日    | 2026-05-19 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] controller
- [x] usecase
- [ ] domain
- [ ] infrastructure
- [ ] frontend
- [ ] infra
- [x] test
- [x] docs

## 影響範囲

- CLI dispatcher and new `expect` command
- package template docs copied by init/update
- docs and tests

## 実装方針

Schema / examples を package templates として追加し、`expect` command で JSON と template-subset YAML を validation する。profile docs migration に3ファイルを追加し、target projects にコピーされるようにする。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0187 | structured AC/Test Matrix templates と validator を実装 | Implementation | 2h | TASK-0186 | No |

依存グラフ: `TASK-0186 -> TASK-0187`

## リスク

- リスク1: YAML parser が過剰になる → template subset 限定
- リスク2: examples が docs から見つからない → README / docs/cli / template README に導線追加
- リスク3: copied files が増えて init tests に影響 → focused tests を更新

## 必要な検証

- [x] unit test: `node --test tests/cli/expect.test.mjs`
- [x] integration test: `npm test`
- [x] security scan: validator does not eval input
- [x] architecture boundary check: File Scope diff review

## 自動採点

```yaml
eval_feedback:
  target_file: "plans/PLAN-0050-ac-test-matrix-structured-formats.md"
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
