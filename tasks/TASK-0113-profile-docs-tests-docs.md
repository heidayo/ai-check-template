# TASK-0113: Profile docs tests and docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0113 |
| SPEC-ID   | SPEC-0030 |
| PLAN-ID   | PLAN-0030 |
| ステータス | Done |
| 担当Agent | Test+Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0111, TASK-0112 |
| 見積     | 45m |

## 責務

init/update tests と external docs に profile docs migration の selected-only / no-overwrite behavior を固定する。

## 入力

- `tests/cli/init.test.mjs`
- `tests/cli/update.test.mjs`
- `tests/cli/package.test.mjs`
- `docs/cli.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`

## 出力

- init selected profile docs tests
- update missing/keep docs tests
- package smoke required file update
- README / README-ja / CLI docs / roadmap updates

## File Scope（変更許可範囲）

- 変更: `tests/cli/init.test.mjs`
- 変更: `tests/cli/update.test.mjs`
- 変更: `tests/cli/package.test.mjs`
- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 削除: なし

## 禁止事項

- implementation files を変更しない
- package templates を変更しない
- doctor docs diagnostics 実装済みと書かない
- npm publish 済みと書かない
- 未完了 marker comment を残さない

## 完了条件

- [x] init base/addon docs test が pass
- [x] init selected-only docs test が pass
- [x] dry-run no docs write test が pass
- [x] update create/keep docs test が pass
- [x] package smoke includes `src/cli/profile-docs.mjs`
- [x] README / README-ja / `docs/cli.md` / roadmap が profile docs migration に言及する
- [x] TASK-0113 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`
- docs grep
- `make validate`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| init test failure | resolver mapping または init integration を TASK scope に戻して修正 |
| update test failure | update create/keep path を TASK scope に戻して修正 |
| docs overclaim | diagnostics / publish claim を削除 |
| package smoke failure | required runtime files list を更新 |

## Knowledge Management

docs mismatch または test regression が発生した場合、maintainer が stale docs location, expected behavior, actual behavior を `sage/failures.md` に記録する。

## 段階採用

docs は profile-aware file migration の最小 copy surface に限定し、doctor diagnostics / cleanup は future work として残す。

## Done Definition

SPEC-0030 AC-01..AC-09 の tests/docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0030-task-0113 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
