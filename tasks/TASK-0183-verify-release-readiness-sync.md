# TASK-0183: Verify Release Readiness Sync

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0183 |
| SPEC-ID   | SPEC-0047 |
| PLAN-ID   | PLAN-0047 |
| ステータス | Done |
| 担当Agent | Review |
| 並列可否  | No |
| 依存TASK  | TASK-0180, TASK-0181, TASK-0182 |
| 見積     | 30m |

## 責務

SPEC-0047 の全ACを検証し、Codex / Claude Code の分担結果を統合確認する。

## 入力

- TASK-0179..0182 outputs
- SPEC-0047 acceptance criteria
- PLAN-0047 task graph

## 出力

- Updated SAGE statuses
- Validation command results
- Scope conflict check result
- Commit / PR ready state

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `specs/SPEC-0047-release-readiness-onboarding-sync.md`
- 変更: `plans/PLAN-0047-release-readiness-onboarding-sync.md`
- 変更: `tasks/TASK-0179-public-onboarding-release-state.md`
- 変更: `tasks/TASK-0180-formal-name-entrypoint-docs.md`
- 変更: `tasks/TASK-0181-cli-fixture-self-validation.md`
- 変更: `tasks/TASK-0182-claude-sage-doc-sync.md`
- 変更: `tasks/TASK-0183-verify-release-readiness-sync.md`
- 変更: `tasks/done-def-SPEC-0047-round-1.md`
- 削除: なし

## 禁止事項

- 実装ファイルの修正をこのTASKで行わない
- failing validation を無視しない
- `--no-verify` を使わない
- Codex / Claude Code の File Scope 外変更を取り込まない

## 完了条件

- [x] SPEC-0047 AC-01..AC-12 が pass / fail / skipped の根拠付きで更新されている
- [x] `node --test tests/cli/*.test.mjs` が pass する
- [x] `make validate` が pass する
- [x] `bash scripts/sage-validate.sh` が pass する
- [x] `git diff --check` が pass する
- [x] Codex / Claude Code の File Scope に重複または越境がない
- [x] TASK statuses と実行ログが更新されている

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0047-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-19-spec-0047-task-0183 |
| 開始     | 2026-05-19 |
| 完了     | 2026-05-19 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0183-verify-release-readiness-sync.md"
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
