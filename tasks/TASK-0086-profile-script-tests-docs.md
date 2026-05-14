# TASK-0086: Profile script tests and docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0086 |
| SPEC-ID   | SPEC-0022 |
| PLAN-ID   | PLAN-0022 |
| ステータス | Done |
| 担当Agent | Test+Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0084, TASK-0085 |
| 見積     | 50m |

## 責務

profile script migration behavior を CLI tests / package tests で固定し、README / README-ja / `docs/cli.md` / roadmap に説明を追加する。

## 入力

- `src/cli/profile-scripts.mjs`
- `src/cli/init.mjs`
- `src/cli/doctor.mjs`
- `src/cli/update.mjs`
- `tests/cli/*.test.mjs`
- `docs/cli.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`

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
- docs に npm publish 完了表現を書かない
- docs に package manager detection 実装済みと書かない
- TODO/FIXME を残さない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] node-cli init / doctor / update migration tests が pass
- [x] supabase addon scripts tests が pass
- [x] update dry-run snapshot test が pass
- [x] package dry-run test が `src/cli/profile-scripts.mjs` を required file として検証する
- [x] README / README-ja / `docs/cli.md` / roadmap が profile-aware script migration に言及する
- [x] TASK-0086 採点が 100/S++

## Tests

- `node --test tests/cli/init.test.mjs`
- `node --test tests/cli/doctor.test.mjs`
- `node --test tests/cli/update.test.mjs`
- `node --test tests/cli/package.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| test expectation stale | expected profile script strings を resolver に合わせる |
| docs overclaim | publish / package-manager auto-detection 表現を削除 |
| package test missing file | requiredFiles に `src/cli/profile-scripts.mjs` を追加 |

## Knowledge Management

profile script test false positive / false negative が発生した場合、maintainer が fixture, command, expected, actual を `sage/failures.md` に記録する。

## 段階採用

docs は v0.2.0 alpha の package script migration として説明し、dependency install / package manager detection は未完了として残す。

## Done Definition

SPEC-0022 AC-01..AC-10 の test / docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0022-task-0086 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
