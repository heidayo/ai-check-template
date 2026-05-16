# TASK-0116: Claude hook CLI integration

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0116 |
| SPEC-ID   | SPEC-0031 |
| PLAN-ID   | PLAN-0031 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0115 |
| 見積     | 35m |

## 責務

`init` / `update` の Claude settings merge/update path で rendered hook fragment を使う。

## 入力

- TASK-0115 `renderClaudeHookSettings`
- SPEC-0031 FR-05..FR-07
- existing init/update hook settings logic

## 出力

- Updated `src/cli/init.mjs`
- Updated `src/cli/update.mjs`

## File Scope（変更許可範囲）

- 変更: `src/cli/init.mjs`
- 変更: `src/cli/update.mjs`
- 削除: なし

## 禁止事項

- resolver / tests / docs / package templates を変更しない
- repository root `.claude/**` を変更しない
- existing init default preserve semantics を変えない
- update の effective option resolution を迂回しない
- dry-run write guard を壊さない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] init は selected/detected package manager で rendered fragment を merge する
- [x] init default は existing hook group を preserve する
- [x] init `--overwrite` は rendered hook group で置き換える
- [x] update は effective package manager で rendered fragment を compare/update する
- [x] dry-run は hook settings を書き換えない
- [x] TASK-0116 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| init writes pnpm for npm project | fragment read 後に renderer を適用する |
| init overwrites existing hook unexpectedly | `!options.overwrite` skip branch を復元する |
| update keeps stale pnpm command | expected hooks を rendered hooks に差し替える |
| dry-run writes settings | existing `writeJson(..., { dryRun })` または `!options.dryRun` guard を使う |

## Knowledge Management

init/update integration regression が再発した場合、maintainer が command, target settings before/after, operation output を `sage/failures.md` に記録する。

## 段階採用

既存 template fragment を維持したまま runtime render のみ追加するため、既存 target projects は `update --claude-hooks` 実行時だけ影響を受ける。

## Done Definition

SPEC-0031 AC-04, AC-05, AC-06, AC-07 の integration path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0031-task-0116 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
