# TASK-0045: Template catalog updates

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0045 |
| SPEC-ID   | SPEC-0012 |
| PLAN-ID   | PLAN-0012 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0043, TASK-0044 |
| 見積     | 35m |

## Goal

新規 test design template と diagnostic repair prompt を package catalog / root docs / roadmap から見つけられるようにする。

## Scope

- prompts README の提供物表と推奨 flow を更新する
- package-templates README の構造を更新する
- root README / README-ja / roadmap の導線を更新する

## Non-goals

- Makefile validation 追加
- prompt / template 本体の作成
- release notes 作成

## File Scope（変更許可範囲）

- 変更: `package-templates/prompts/README.md`
- 変更: `package-templates/README.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 作成/削除: なし

## 禁止事項

- v0.1.0 release 済みのように書かない
- CLI scaffolding 済みのように書かない
- `.github/**` を変更しない

## 完了条件

- [x] prompts README が `diagnostic-repair.md` に言及する
- [x] package-templates README が `test-design-template.md` と `diagnostic-repair.md` に言及する
- [x] root README / README-ja / roadmap が両ファイルに言及する
- [x] TASK-0045 採点が 100/S++

## Tests

- `grep -q "diagnostic-repair.md" package-templates/prompts/README.md`
- `grep -q "test-design-template.md" package-templates/README.md`
- `grep -q "diagnostic-repair.md" README.md README-ja.md docs/roadmap.md`

## Done Definition

SPEC-0012 AC-04, AC-05, AC-06。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0012 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | Gate 1 PASS / TASK score 100/S++ |
