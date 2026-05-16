# TASK-0117: Claude hook tests and docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0117 |
| SPEC-ID   | SPEC-0031 |
| PLAN-ID   | PLAN-0031 |
| ステータス | Done |
| 担当Agent | Test+Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0115, TASK-0116 |
| 見積     | 45m |

## 責務

Claude hook package manager rendering の CLI tests / package smoke / public docs を更新する。

## 入力

- SPEC-0031 AC-01..AC-09
- TASK-0115 / TASK-0116 implementation
- existing CLI docs and README

## 出力

- Updated `tests/cli/init.test.mjs`
- Updated `tests/cli/update.test.mjs`
- Updated `tests/cli/package.test.mjs`
- Updated `docs/cli.md`
- Updated `README.md`
- Updated `README-ja.md`
- Updated `docs/roadmap.md`

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
- docs に未検証の package manager claims を追加しない
- real dependency install / npm publish を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] init tests cover npm hook command rendering and no generated pnpm command
- [x] init tests cover yarn / bun / pnpm command rendering
- [x] init tests cover preserve default and overwrite behavior
- [x] update tests cover pnpm to npm hook command migration
- [x] update tests cover dry-run no write
- [x] package smoke includes `src/cli/claude-hooks.mjs`
- [x] docs mention package-manager-aware Claude hook rendering
- [x] TASK-0117 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`
- `npm pack --dry-run --json`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| test fixture writes wrong command | expected command table を SPEC-0031 FR に合わせる |
| dry-run test mutates settings | before/after JSON assertion を追加して integration を修正依頼する |
| package smoke missing module | requiredFiles に `src/cli/claude-hooks.mjs` を追加 |
| docs overclaim | CLI alpha scope と実装済み command rendering に表現を限定する |

## Knowledge Management

test gap / docs overclaim が再発した場合、maintainer が missing scenario, expected assertion, affected doc section を `sage/failures.md` に記録する。

## 段階採用

docs は alpha CLI の hook rendering 範囲に限定し、diagnostics / template redesign は follow-up として残す。

## Done Definition

SPEC-0031 AC-01..AC-09 の test/docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0031-task-0117 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
