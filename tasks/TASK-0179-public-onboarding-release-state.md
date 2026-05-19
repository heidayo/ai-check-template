# TASK-0179: Public Onboarding Release State

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0179 |
| SPEC-ID   | SPEC-0047 |
| PLAN-ID   | PLAN-0047 |
| ステータス | Done |
| 担当Agent | Codex Implementation |
| 並列可否  | No |
| 依存TASK  | none |
| 見積     | 45m |

## 責務

README と public docs の初見導線、release state、SAGE 非依存説明を同期する。

## 入力

- SPEC-0047
- PLAN-0047
- GPT / Claude Code 評価まとめ
- 現行 `README.md`, `README-en.md`, `README-ja.md`, `docs/roadmap.md`, `docs/cli.md`, `docs/usage-model.md`

## 出力

- 初見ユーザー向けに短くなった README 冒頭 / Quick start
- release state と npm package version の説明が同期した public docs
- SAGE 非依存性が README 上部で確認できる状態

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `README.md`
- 変更: `README-en.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 変更: `docs/cli.md`
- 変更: `docs/usage-model.md`
- 削除: なし

## 禁止事項

- `CLAUDE.md`, `.claude/`, `package-templates/.claude/` を変更しない
- CLI behavior / source code / tests を変更しない
- release tag / npm publish / package version bump を行わない
- SAGE governance 本体を変更しない

## 完了条件

- [x] README の最初の導入コマンドが推奨 dry-run path として 1 本に整理されている
- [x] README / docs が npm `ai-check-template@0.2.0` と v0.3.0 GitHub Actions integration release の違いを説明している
- [x] README 上部で「利用者は SAGE 不要」が明示されている
- [x] `make validate-structure` が pass する
- [x] `git diff --check` が pass する

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0047-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-19-spec-0047-task-0179 |
| 開始     | 2026-05-19 |
| 完了     | 2026-05-19 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0179-public-onboarding-release-state.md"
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
