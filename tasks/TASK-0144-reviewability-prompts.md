# TASK-0144: Reviewability prompts

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0144 |
| SPEC-ID   | SPEC-0039 |
| PLAN-ID   | PLAN-0039 |
| ステータス | Done |
| 担当Agent | Docs |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 35m |

## 責務

AI 生成コードの設計説明、トレードオフ分析、理解度確認、レビュー訓練に使う 4 つの prompt template を追加する。

## 入力

- SPEC-0039
- PLAN-0039
- package-templates/prompts の既存構成

## 出力

- `package-templates/prompts/design-explanation.md`
- `package-templates/prompts/tradeoff-analysis.md`
- `package-templates/prompts/self-understanding-check.md`
- `package-templates/prompts/review-training.md`

## File Scope（変更許可範囲）

- 作成: `package-templates/prompts/design-explanation.md`
- 作成: `package-templates/prompts/tradeoff-analysis.md`
- 作成: `package-templates/prompts/self-understanding-check.md`
- 作成: `package-templates/prompts/review-training.md`
- 変更: なし
- 削除: なし

## 禁止事項

- diagnostic-repair の修復責務と混同しない
- prompt が AI の自己申告だけで完了する構造にしない
- external article の文面を長文転載しない

## 完了条件

- [x] four prompt files exist
- [x] each prompt file includes Purpose, Prompt, Usage, and Review Output
- [x] prompts ask for evidence, uncertainty, and reviewer-facing output

## Tests

- `test -f package-templates/prompts/design-explanation.md`
- `test -f package-templates/prompts/tradeoff-analysis.md`
- `test -f package-templates/prompts/self-understanding-check.md`
- `test -f package-templates/prompts/review-training.md`
- `grep -q "^## Review Output" package-templates/prompts/design-explanation.md`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| prompt lacks evidence requirement | Add explicit evidence and uncertainty requirements |
| prompt overlaps repair flow | Reword as explanation / review, not patch generation |

## Knowledge Management

Prompt output が noisy だった場合、maintainer が before / after prompt text と expected output を `sage/failures.md` に記録する。

## 段階採用

Prompt library を追加するだけに留め、Claude Code Skill や hook automation は別 SPEC に分離する。

## 採点

- TASK-0144: 100/S++

## Done Definition

TASK-0146 の検証で AC-03 が pass する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0039-task-0144 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
