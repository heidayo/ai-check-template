# TASK-0040: Before / After example docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0040 |
| SPEC-ID   | SPEC-0011 |
| PLAN-ID   | PLAN-0011 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0039 |
| 見積     | 45m |

## Goal

Before / After の読み物と runnable example の使い方を外部利用者向けに説明する。

## Scope

- example README
- Before doc
- After doc

## Non-goals

- root README 更新
- roadmap 更新
- screenshots

## File Scope（変更許可範囲）

- 作成: `examples/nextjs-basic/README.md`
- 作成: `examples/nextjs-basic/docs/before.md`
- 作成: `examples/nextjs-basic/docs/after.md`
- 変更/削除: なし

## 禁止事項

- Before snippet を copy 推奨に見せない
- unfinished markers を残さない
- 実在個人情報を使わない

## 完了条件

- [x] before.md が失敗点を 3 件以上説明する
- [x] after.md が acceptance criteria と test mapping を含む
- [x] README が `pnpm ai:check` 実行手順を含む
- [x] TASK-0040 採点が 100/S++

## Tests

- `grep -c "Failure" examples/nextjs-basic/docs/before.md`
- `grep -q "Acceptance criteria" examples/nextjs-basic/docs/after.md`
- `grep -q "pnpm ai:check" examples/nextjs-basic/README.md`

## Done Definition

SPEC-0011 AC-03, AC-04。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0011 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | Gate 1 PASS / TASK score 100/S++ |
