# TASK-0105: Support script CLI tests and docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0105 |
| SPEC-ID   | SPEC-0028 |
| PLAN-ID   | PLAN-0028 |
| ステータス | Done |
| 担当Agent | Test+Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0104 |
| 見積     | 45m |

## 責務

init / update / doctor tests と external docs に support script defaults の behavior を固定する。

## 入力

- `tests/cli/init.test.mjs`
- `tests/cli/doctor.test.mjs`
- `tests/cli/update.test.mjs`
- `docs/cli.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`

## 出力

- Updated CLI tests
- Updated CLI docs / README / roadmap

## File Scope（変更許可範囲）

- 変更: `tests/cli/init.test.mjs`
- 変更: `tests/cli/doctor.test.mjs`
- 変更: `tests/cli/update.test.mjs`
- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 削除: なし

## 禁止事項

- implementation outside TASK-0104 を変更しない
- dependency install 実装済みと書かない
- package templates を変更しない
- npm publish 済みと書かない
- 未完了 marker comment を残さない

## 完了条件

- [x] init support script creation test が pass
- [x] update support script creation test が pass
- [x] existing support script preservation test が pass
- [x] doctor strict no `script-advice` test が pass
- [x] README / README-ja / `docs/cli.md` / roadmap が support script defaults に言及する
- [x] TASK-0105 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`
- docs grep
- `make validate`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| init test failure | support merge order を修正 |
| update test failure | update missing-only create path を修正 |
| docs overclaim | dependency install claim を削除 |

## Knowledge Management

docs mismatch が発生した場合、maintainer が stale docs location, expected behavior, actual text を `sage/failures.md` に記録する。

## 段階採用

docs は support script entry creation に限定し、dependency install と semantic tool detection は future work として残す。

## Done Definition

SPEC-0028 AC-01..AC-06 の tests/docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0028-task-0105 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
