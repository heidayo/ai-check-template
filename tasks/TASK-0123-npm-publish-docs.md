# TASK-0123: npm publish docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0123 |
| SPEC-ID   | SPEC-0033 |
| PLAN-ID   | PLAN-0033 |
| ステータス | Done |
| 担当Agent | Docs |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 35m |

## 責務

public docs を npm published alpha CLI の導線に更新する。

## File Scope（変更許可範囲）

- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/cli.md`
- 変更: `docs/roadmap.md`
- 削除: なし

## 禁止事項

- package code / templates を変更しない
- npm token / auth URL / OTP を書かない
- v0.2.0 stable と誤表記しない
- registry write operation を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] README / README-ja / `docs/cli.md` mention `npx -y ai-check-template@next init`
- [x] roadmap marks npm publish item Done
- [x] docs preserve manual copy / local clone fallback
- [x] TASK-0123 採点が 100/S++

## Tests

- `rg -n "npx -y ai-check-template@next init" README.md README-ja.md docs/cli.md`
- `rg -n "\\[x\\] npm publish and" docs/roadmap.md`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| missing npx docs | quick start / CLI command section を更新 |
| stable overclaim | alpha / `@next` wording に戻す |
| roadmap unchecked | checkbox を Done に修正 |

## Knowledge Management

docs confusion が再発した場合、maintainer が confusing phrase, expected wording, affected doc を `sage/failures.md` に記録する。

## 段階採用

npm alpha path を primary にしつつ、manual copy と local clone path を fallback として残す。

## Done Definition

SPEC-0033 AC-01, AC-05 の docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0033-task-0123 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
