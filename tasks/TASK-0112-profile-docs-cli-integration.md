# TASK-0112: Profile docs CLI integration

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0112 |
| SPEC-ID   | SPEC-0030 |
| PLAN-ID   | PLAN-0030 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0111 |
| 見積     | 45m |

## 責務

`init` と `update` に profile docs copy/create path を追加し、dry-run と existing docs preservation を実装する。

## 入力

- `src/cli/init.mjs`
- `src/cli/update.mjs`
- TASK-0111 profile docs resolver

## 出力

- init profile docs copy operations
- update profile docs create-missing operations
- update existing docs keep operations

## File Scope（変更許可範囲）

- 変更: `src/cli/init.mjs`
- 変更: `src/cli/update.mjs`
- 削除: なし

## 禁止事項

- profile docs resolver を変更しない
- tests / docs / SAGE status を変更しない
- doctor を変更しない
- package templates を変更しない
- update で existing docs を overwrite しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] init が profile docs を copy / would-copy する
- [x] update が missing profile docs を create / would-create する
- [x] update が existing profile docs を keep する
- [x] dry-run が target docs を作らない
- [x] TASK-0112 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| init docs missing | init copyProfileDocs call order を修正 |
| update overwrite | update create-missing helper の exists branch を keep に戻す |
| dry-run writes | fs copy/write を dryRun guard 内に戻す |

## Knowledge Management

CLI integration regression が再発した場合、maintainer が command, profile, expected operation, actual output を `sage/failures.md` に記録する。

## 段階採用

profile docs migration は additive docs copy に限定し、diagnostics / cleanup は follow-up に残す。

## Done Definition

SPEC-0030 AC-01, AC-02, AC-03, AC-04, AC-05 の CLI integration path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0030-task-0112 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
