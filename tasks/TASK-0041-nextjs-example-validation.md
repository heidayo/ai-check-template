# TASK-0041: repository docs and validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0041 |
| SPEC-ID   | SPEC-0011 |
| PLAN-ID   | PLAN-0011 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0040 |
| 見積     | 40m |

## Goal

root docs から example へ導線を張り、root `make validate` に example structural checks を追加する。

## Scope

- root README / README-ja
- roadmap
- Makefile validation

## Non-goals

- GitHub Actions workflow 変更
- package-templates script 変更

## File Scope（変更許可範囲）

- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 変更: `Makefile`
- 作成/削除: なし

## 禁止事項

- `.github/workflows/**` を変更しない
- root CI で example dependency install を必須にしない
- v0.1.0 release 済みのように書かない

## 完了条件

- [x] README.md / README-ja.md / docs/roadmap.md が `examples/nextjs-basic` に言及する
- [x] `make validate` が example required files と scripts を検証する
- [x] `make validate` が pass
- [x] TASK-0041 採点が 100/S++

## Tests

- `grep -q "examples/nextjs-basic" README.md README-ja.md docs/roadmap.md`
- `make validate`

## Done Definition

SPEC-0011 AC-06, AC-07, AC-10。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0011 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | Gate 1/2/4 PASS / TASK score 100/S++ |
