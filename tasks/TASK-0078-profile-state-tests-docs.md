# TASK-0078: Profile state tests and docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0078 |
| SPEC-ID   | SPEC-0020 |
| PLAN-ID   | PLAN-0020 |
| ステータス | Done |
| 担当Agent | Test+Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0076, TASK-0077 |
| 見積     | 45m |

## 責務

install state behavior を CLI tests / package tests で固定し、README / README-ja / `docs/cli.md` / roadmap に profile state foundation を説明する。

## 入力

- `src/cli/install-state.mjs`
- `src/cli/init.mjs`
- `src/cli/doctor.mjs`
- `src/cli/update.mjs`
- `docs/cli.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`
- SPEC-0020 AC-01..AC-12

## 出力

- Updated CLI tests
- Updated package pack test
- Updated docs

## File Scope（変更許可範囲）

- 変更: `tests/cli/init.test.mjs`
- 変更: `tests/cli/doctor.test.mjs`
- 変更: `tests/cli/update.test.mjs`
- 変更: `tests/cli/package.test.mjs`
- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 削除: なし

## 禁止事項

- implementation files を変更しない
- `package-templates/**` を変更しない
- docs に実在しない npm publish 完了表現を書かない
- TODO/FIXME を残さない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] init state creation test が pass
- [x] doctor state-aware default / JSON / malformed state tests が pass
- [x] update state-aware repair / dry-run / override / malformed state tests が pass
- [x] package dry-run test が `src/cli/install-state.mjs` を required file として検証する
- [x] README / README-ja / `docs/cli.md` / roadmap が install state に言及する
- [x] TASK-0078 採点が 100/S++

## Tests

- `node --test tests/cli/init.test.mjs`
- `node --test tests/cli/doctor.test.mjs`
- `node --test tests/cli/update.test.mjs`
- `node --test tests/cli/package.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| flaky state assertion | deterministic JSON fields のみに assertion を限定 |
| docs overclaim publish | roadmap / README から publish 完了表現を削除 |
| package test missing file | requiredFiles に `src/cli/install-state.mjs` を追加 |

## Knowledge Management

state tests の false positive / false negative が発生した場合、maintainer が fixture, command, expected, actual を `sage/failures.md` に記録する。

## 段階採用

docs は alpha foundation として説明し、profile-specific migration や actual npm publish は未完了として残す。

## Done Definition

SPEC-0020 AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11 の test / docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0020-task-0078 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
