# TASK-0109: Dependency installer tests and docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0109 |
| SPEC-ID   | SPEC-0029 |
| PLAN-ID   | PLAN-0029 |
| ステータス | Done |
| 担当Agent | Test+Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0107, TASK-0108 |
| 見積     | 45m |

## 責務

fake package manager tests と external docs に `--install-deps` の opt-in behavior、dry-run safety、scope limits を固定する。

## 入力

- `tests/cli/init.test.mjs`
- `tests/cli/update.test.mjs`
- `tests/cli/package.test.mjs`
- `docs/cli.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`

## 出力

- init / update fake install tests
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
- real dependency install を実行しない
- actual npm publish 済みと書かない
- external toolchain install 済みと書かない
- package templates を変更しない
- 未完了 marker comment を残さない

## 完了条件

- [x] init fake install test が pass
- [x] update fake install JSON test が pass
- [x] missing binary no-write test が pass
- [x] dry-run no binary / no lockfile test が pass
- [x] package smoke includes `src/cli/dependency-installer.mjs`
- [x] docs mention opt-in install and external toolchain exclusions
- [x] TASK-0109 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`
- docs grep
- `make validate`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| fake install test failure | fake binary PATH / expected args を修正 |
| docs overclaim | external toolchain / publish claim を削除 |
| package smoke failure | required runtime files list を更新 |

## Knowledge Management

docs mismatch または fake install regression が発生した場合、maintainer が stale docs location or command, expected behavior, actual behavior を `sage/failures.md` に記録する。

## 段階採用

docs は optional dependency install に限定し、external CLIs / deeper profile-aware file migrations は follow-up として残す。

## Done Definition

SPEC-0029 AC-01..AC-10 の tests/docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0029-task-0109 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
