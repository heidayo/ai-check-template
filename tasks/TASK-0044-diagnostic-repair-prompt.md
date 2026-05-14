# TASK-0044: Diagnostic repair prompt

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0044 |
| SPEC-ID   | SPEC-0012 |
| PLAN-ID   | PLAN-0012 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 45m |

## Goal

`ai:check` や diagnostic output の失敗後に、AI へ安全に修復を依頼する prompt を追加する。

## Scope

- Existing prompt style に合わせた Markdown prompt を作成する
- Diagnostic Output / Repair Plan / Patch Rules / Re-check Commands / AC immutable rule を含める
- Redacted diagnostic output を使うよう明記する

## Non-goals

- test design template 作成
- script / CI の挙動変更
- tool-specific log parser の実装

## File Scope（変更許可範囲）

- 作成: `package-templates/prompts/diagnostic-repair.md`
- 変更/削除: なし

## 禁止事項

- AC の後付け変更を許さない
- secret 値の貼付を要求しない
- failing output の隠蔽を許さない

## 完了条件

- [x] `package-templates/prompts/diagnostic-repair.md` が存在する
- [x] 必須見出し `Diagnostic Output`, `Repair Plan`, `Patch Rules`, `Re-check Commands`, `Do Not Change Acceptance Criteria` が存在する
- [x] redacted diagnostic output と secret 非貼付を要求する
- [x] TASK-0044 採点が 100/S++

## Tests

- `test -f package-templates/prompts/diagnostic-repair.md`
- `grep -q "Do Not Change Acceptance Criteria" package-templates/prompts/diagnostic-repair.md`
- `grep -qi "redacted" package-templates/prompts/diagnostic-repair.md`

## Done Definition

SPEC-0012 AC-01, AC-03, AC-08, AC-13。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0012 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | Gate 1/2/3 PASS / TASK score 100/S++ |
