# TASK-0088: Doctor strict flag

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0088 |
| SPEC-ID   | SPEC-0023 |
| PLAN-ID   | PLAN-0023 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 35m |

## 責務

`doctor --strict` flag を追加し、warnings を strict mode の failure condition に含める。

## 入力

- `src/cli/doctor.mjs`
- `src/cli/index.mjs`
- SPEC-0023 FR-01..FR-07

## 出力

- `src/cli/doctor.mjs` updates
- `src/cli/index.mjs` top-level help update

## File Scope（変更許可範囲）

- 変更: `src/cli/doctor.mjs`
- 変更: `src/cli/index.mjs`
- 削除: なし

## 禁止事項

- `init`, `update`, profile diagnostics, profile scripts を変更しない
- default mode で warnings を failure にしない
- warnings を issues に変換しない
- target に書き込まない
- `package-templates/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `doctor --help` / top-level help が `--strict` を表示する
- [x] output に `strict` boolean が追加される
- [x] strict mode が warnings を failure に含める
- [x] default mode は warnings-only で pass のまま
- [x] TASK-0088 採点が 100/S++

## Tests

- `node --test tests/cli/doctor.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| default warning failure | status calculation を strict opt-in に戻す |
| strict warning pass | strict condition に warnings length を含める |
| JSON shape regression | existing fields を維持し `strict` のみ追加 |

## Knowledge Management

strict flag regression が再発した場合、maintainer が command, warning count, expected status, actual output を `sage/failures.md` に記録する。

## 段階採用

strict mode は opt-in flag として導入し、warning severity / ignore config は follow-up に残す。

## Done Definition

SPEC-0023 AC-01, AC-03, AC-04, AC-05, AC-06, AC-07 の implementation path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0023-task-0088 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
