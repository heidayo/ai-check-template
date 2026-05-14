# TASK-0072: CLI update command

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0072 |
| SPEC-ID   | SPEC-0019 |
| PLAN-ID   | PLAN-0019 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 50m |

## 責務

`ai-check-template update` の guarded write command implementation と top-level dispatch を追加する。

## 入力

- `src/cli/index.mjs`
- `src/cli/utils.mjs`
- `package-templates/**` read-only
- SPEC-0019 FR-01..FR-08

## 出力

- `src/cli/update.mjs`
- `src/cli/index.mjs` updates

## File Scope（変更許可範囲）

- 作成: `src/cli/update.mjs`
- 変更: `src/cli/index.mjs`
- 変更: `tests/cli/package.test.mjs`
- 削除: なし

## 禁止事項

- `--yes` なしで target files を書き換えない
- `--dry-run` で target files を書き換えない
- known managed paths 以外を書き換えない
- `package.json`, `package-templates/**`, `.github/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` を変更しない
- npm publish を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `node bin/ai-check-template.mjs update --help` が pass
- [x] `node bin/ai-check-template.mjs --help` が `update` を表示する
- [x] drift fixture で update 後 doctor が exit 0 を返す
- [x] `--dry-run` が write しない
- [x] TASK-0072 採点が 100/S++

## Tests

- `node bin/ai-check-template.mjs update --help`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| help missing | `src/cli/index.mjs` usage / dispatch を修正 |
| update without yes writes | `--yes` guard を修正 |
| dry-run writes | write adapter / dry-run branch を修正 |
| doctor after update fails | expected template write mapping を修正 |

## Knowledge Management

update command failure が再発した場合、maintainer が command, fixture, expected, actual output を `sage/failures.md` に記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

known template-managed surface の guarded update のみを追加し、profile-aware migration は follow-up SPEC に残す。

## Done Definition

SPEC-0019 AC-01, AC-04..AC-07, AC-09 の implementation path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0019-task-0072 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
