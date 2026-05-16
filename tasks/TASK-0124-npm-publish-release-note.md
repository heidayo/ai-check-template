# TASK-0124: npm publish release note

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0124 |
| SPEC-ID   | SPEC-0033 |
| PLAN-ID   | PLAN-0033 |
| ステータス | Done |
| 担当Agent | Docs |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 25m |

## 責務

`docs/releases/v0.2.0-alpha.0.md` を追加し、publish evidence と npx smoke evidence を記録する。

## File Scope（変更許可範囲）

- 作成: `docs/releases/v0.2.0-alpha.0.md`
- 削除: なし

## 禁止事項

- npm auth material を書かない
- local absolute temp path を書かない
- package code / templates を変更しない
- registry write operation を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] release note exists
- [x] version `0.2.0-alpha.0` を記録
- [x] npm view / npx smoke の evidence を記録
- [x] alpha limitation を明記
- [x] TASK-0124 採点が 100/S++

## Tests

- `test -f docs/releases/v0.2.0-alpha.0.md`
- `rg -n "0.2.0-alpha.0|npx -y ai-check-template@next|npm view" docs/releases/v0.2.0-alpha.0.md`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| missing evidence | publish / smoke command summary を追記 |
| auth material present | 該当文字列を削除 |
| stable overclaim | alpha limitation を追記 |

## Knowledge Management

release note evidence の不足が再発した場合、maintainer が missing command, expected evidence, affected release note を `sage/failures.md` に記録する。

## 段階採用

alpha release note として記録し、stable v0.2.0 release notes は follow-up に残す。

## Done Definition

SPEC-0033 AC-02, AC-04 の release note path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0033-task-0124 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
