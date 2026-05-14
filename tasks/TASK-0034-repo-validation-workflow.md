# TASK-0034: repo validation workflow

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0034 |
| SPEC-ID   | SPEC-0010 |
| PLAN-ID   | PLAN-0010 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 45m |

## Goal

本リポ自身の PR / main push で最低限の構造・構文チェックを実行できるようにする。

## Scope

- `Makefile` に `validate` 系 target を追加する
- `.github/workflows/validate.yml` を追加する

## Non-goals

- Node package install
- npm publish workflow
- reusable workflow example の作成

## File Scope（変更許可範囲）

- 作成: `Makefile`, `.github/workflows/validate.yml`
- 変更: なし
- 削除: なし

## 禁止事項

- `package.json` を追加しない
- `scripts/sage-validate.sh` の存在を必須にしない
- SAGE protected files を変更しない

## 完了条件

- [x] `make validate` が pass
- [x] `.github/workflows/validate.yml` が `make validate` を呼ぶ
- [x] workflow に `permissions: contents: read` がある
- [x] YAML syntax validation が pass

## Tests

- `make validate`
- `ruby -e 'require "yaml"; ARGV.each { |f| YAML.load_file(f) }' .github/workflows/*.yml`

## Done Definition

SPEC-0010 AC-01, AC-02, AC-03, AC-07, AC-12。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0010 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: pass / functional: pass / security: pass / architecture: pass |
