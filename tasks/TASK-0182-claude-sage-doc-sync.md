# TASK-0182: Claude SAGE Doc Sync

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0182 |
| SPEC-ID   | SPEC-0047 |
| PLAN-ID   | PLAN-0047 |
| ステータス | Done |
| 担当Agent | Claude Code Implementation |
| 並列可否  | Yes |
| 依存TASK  | TASK-0179 |
| 見積     | 40m |

sage-managed: true

## 責務

Claude Code / SAGE 運用文書を現行 public docs に追従させ、利用者が SAGE 必須と誤解しないようにする。

## 入力

- SPEC-0047
- PLAN-0047
- Claude Code との認識合わせ結果
- `docs/roadmap.md`
- `docs/cli.md`
- `package.json` の `files`

## 出力

- root `CLAUDE.md` は内部開発者向け文書であり、利用者は SAGE 不要と分かる
- `.claude/rules/ai-check-template.md` は古い Phase / CLI 実装予定表記を持たず、roadmap / cli docs を参照する
- `package-templates/.claude/README.md` は配布物として SAGE 非依存であることを明示する
- 必要なら `package-templates/.claude/rules/test-rules.md` の Draft / Phase 表記が更新される

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `CLAUDE.md`
- 変更: `.claude/rules/ai-check-template.md`
- 変更: `package-templates/.claude/README.md`
- 変更: `package-templates/.claude/rules/test-rules.md`
- 変更: `package-templates/.claude/settings.hook-fragment.json`
- 削除: なし

## 禁止事項

- README / `docs/` / `tests/cli/` / `src/` / `bin/` を変更しない
- SAGE governance 本体（`sage/`）を変更しない
- `package-templates/.claude/settings.hook-fragment.json` はコマンド齟齬がある場合以外は変更しない
- npm package version / release state を独自に固定値で二重管理しない

## 完了条件

- [x] `CLAUDE.md` が root repository maintainer 向けであり、利用者は SAGE 不要と明記している
- [x] `.claude/rules/ai-check-template.md` の古い Phase 未着手表記が現行 docs 参照または更新済み表記になっている
- [x] `package-templates/.claude/README.md` が配布物として SAGE 非依存であることを明記している
- [x] `package-templates/.claude/rules/test-rules.md` の Draft / Phase 表記が現行状態と矛盾しない
- [x] `git diff --check` が pass する

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0047-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-19-spec-0047-task-0182 |
| 開始     | 2026-05-19 |
| 完了     | 2026-05-19 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0182-claude-sage-doc-sync.md"
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
