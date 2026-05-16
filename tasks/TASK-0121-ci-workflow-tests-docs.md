# TASK-0121: CI workflow tests and docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0121 |
| SPEC-ID   | SPEC-0032 |
| PLAN-ID   | PLAN-0032 |
| ステータス | Done |
| 担当Agent | Test+Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0119, TASK-0120 |
| 見積     | 45m |

## 責務

CI workflow package manager rendering の CLI tests / package smoke / public docs を更新する。

## File Scope（変更許可範囲）

- 変更: `tests/cli/init.test.mjs`
- 変更: `tests/cli/update.test.mjs`
- 変更: `tests/cli/doctor.test.mjs`
- 変更: `tests/cli/package.test.mjs`
- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 削除: なし

## 禁止事項

- implementation files を変更しない
- package templates を変更しない
- docs に npm publish 済みと書かない
- real dependency install / npm publish を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] init tests cover direct workflow commands for npm / yarn / bun / pnpm
- [x] init tests cover reusable caller command rendering
- [x] update tests cover managed pnpm to npm workflow migration
- [x] doctor tests cover npm-rendered healthy workflow
- [x] cleanup tests cover rendered variant cleanup and custom preserve
- [x] package smoke includes `src/cli/ci-workflows.mjs`
- [x] docs mention package-manager-aware CI workflow rendering
- [x] TASK-0121 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`
- `npm pack --dry-run --json`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| test fixture expected wrong command | expected command table を SPEC-0032 FR に合わせる |
| package smoke missing module | requiredFiles に `src/cli/ci-workflows.mjs` を追加 |
| docs overclaim | CLI alpha scope と npm unpublished status に表現を限定する |

## Knowledge Management

test gap / docs overclaim が再発した場合、maintainer が missing scenario, expected assertion, affected doc section を `sage/failures.md` に記録する。

## 段階採用

docs は alpha CLI の CI workflow rendering 範囲に限定し、actual npm publish は別 release operation として残す。

## Done Definition

SPEC-0032 AC-01..AC-09 の test/docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0032-task-0121 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
