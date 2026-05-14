# TASK-0095: Managed workflow cleanup tests and docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0095 |
| SPEC-ID   | SPEC-0025 |
| PLAN-ID   | PLAN-0025 |
| ステータス | Done |
| 担当Agent | Test+Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0094 |
| 見積     | 40m |

## 責務

managed workflow cleanup の dry-run safety / exact-managed deletion / custom workflow preservation / doctor post-check を tests で固定し、docs に cleanup の境界を説明する。

## 入力

- `src/cli/update.mjs`
- `tests/cli/update.test.mjs`
- `docs/cli.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`

## 出力

- Updated update tests
- Updated docs

## File Scope（変更許可範囲）

- 変更: `tests/cli/update.test.mjs`
- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 削除: なし

## 禁止事項

- implementation files を変更しない
- docs に arbitrary workflow cleanup と書かない
- workflow YAML contents を変更しない
- `package-templates/**` を変更しない
- 未完了 marker comment を残さない
- destructive shell deletion commands を使わない

## 完了条件

- [x] dry-run `would-delete` test が pass
- [x] `--ci none --yes` cleanup test が pass
- [x] `--ci reusable --yes` mode switch cleanup test が pass
- [x] custom workflow preservation test が pass
- [x] README / README-ja / `docs/cli.md` / roadmap が managed workflow cleanup に言及する
- [x] TASK-0095 採点が 100/S++

## Tests

- `node --test tests/cli/update.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| dry-run test fails | implementation dry-run branch を修正 |
| cleanup test fails | inactive CI list / exact match helper を修正 |
| custom preservation fails | exact match 判定を修正 |
| docs overclaim | exact-managed workflow のみに表現を限定 |

## Knowledge Management

managed workflow cleanup tests の false positive / false negative が発生した場合、maintainer が fixture, command, expected, actual を `sage/failures.md` に記録する。

## 段階採用

docs は exact-managed workflow cleanup のみを記述し、arbitrary custom workflow cleanup は対象外として残す。

## Done Definition

SPEC-0025 AC-01, AC-02, AC-03, AC-04, AC-05, AC-06 の test / docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0025-task-0095 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
