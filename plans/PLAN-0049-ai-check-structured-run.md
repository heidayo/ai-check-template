# PLAN-0049: ai-check Structured Run

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0049 |
| SPEC-ID   | SPEC-0049 |
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

- CLI dispatcher: `src/cli/index.mjs`
- 新規 command: `src/cli/run.mjs`
- CLI docs / package pack tests
- `tests/cli/run.test.mjs`

## 実装方針

`run` は target `package.json` を読み、指定 script の `&&` chain を順次実行する。step が fail したら残りは command 実行せず `SKIPPED` として result に入れる。`--json` は stdout に machine-readable result、`--output` は同じ result を file に保存する。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0186 | `run` command と tests/docs を実装 | Implementation | 2h | none | No |

依存グラフ: `TASK-0186`

## リスク

- リスク1: shell parsing を広げすぎる → `&&` 限定の明示仕様にする
- リスク2: output redaction 漏れ → token/password/secret patterns を tests に含める
- リスク3: command 実行により fixture 外を触る → tests は temp dir 内 command に限定する

## 必要な検証

- [x] unit test: `node --test tests/cli/run.test.mjs`
- [x] integration test: `npm test`
- [x] security scan: redaction tests
- [x] architecture boundary check: File Scope diff review

## 自動採点

```yaml
eval_feedback:
  target_file: "plans/PLAN-0049-ai-check-structured-run.md"
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
