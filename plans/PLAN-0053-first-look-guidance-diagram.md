# PLAN-0053: First-Look Guidance Diagram

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0053 |
| SPEC-ID   | SPEC-0053 |
| ステータス | Completed |
| 作成日    | 2026-05-19 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [ ] infrastructure
- [ ] frontend
- [ ] infra
- [ ] test
- [x] docs

## 影響範囲

- README first-look section
- usage model core loop
- prompts README recommended flow

## 実装方針

Mermaid diagram を usage model に追加し、prompts README と README からそこへリンクする。既存長文は最小変更に留める。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0190 | GitHub初見導線と1枚絵を追加 | Documentation | 45m | TASK-0189 | No |

依存グラフ: `TASK-0189 -> TASK-0190`

## リスク

- リスク1: diagram と prompt list が drift → filenames を exact text で書く
- リスク2: relative link が壊れる → existing paths のみ参照

## 必要な検証

- [x] docs check: `rg -n 'flowchart|plan-first.md|diagnostic-repair.md|security-scan.md|review-training.md' docs/usage-model.md`
- [x] structure check: `make validate`
- [x] architecture boundary check: File Scope diff review

## 自動採点

```yaml
eval_feedback:
  target_file: "plans/PLAN-0053-first-look-guidance-diagram.md"
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
