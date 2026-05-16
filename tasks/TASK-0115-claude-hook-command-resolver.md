# TASK-0115: Claude hook command resolver

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0115 |
| SPEC-ID   | SPEC-0031 |
| PLAN-ID   | PLAN-0031 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 30m |

## 責務

Claude hook fragment の known managed command を selected package manager の script command に変換する pure helper を実装する。

## 入力

- SPEC-0031 FR-01..FR-04, SEC-01, SEC-02
- existing `scriptCommand`
- existing `validatePackageManager`

## 出力

- `src/cli/claude-hooks.mjs`
- `renderClaudeHookSettings(fragment, packageManager)` helper

## File Scope（変更許可範囲）

- 作成: `src/cli/claude-hooks.mjs`
- 削除: なし

## 禁止事項

- init / update / docs / tests を変更しない
- package templates を変更しない
- repository root `.claude/**` を変更しない
- arbitrary command parser を追加しない
- unknown hook command を変更しない
- runtime dependencies を追加しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `pnpm ai:check:fast` が selected package manager の `ai:check:fast` command に変換される
- [x] `pnpm ai:check` が selected package manager の `ai:check` command に変換される
- [x] unknown command はそのまま残る
- [x] input fragment を in-place mutate しない
- [x] TASK-0115 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| wrong command mapping | `scriptCommand(packageManager, scriptName)` を使う |
| invalid package manager accepted | `validatePackageManager` を render entry point で呼ぶ |
| unknown command changed | exact command match branch のみに戻す |

## Knowledge Management

hook command resolver regression が再発した場合、maintainer が package manager, input command, expected command, actual command を `sage/failures.md` に記録する。

## 段階採用

resolver は write せず、init/update integration からのみ使用する。

## Done Definition

SPEC-0031 AC-01, AC-02, AC-03, AC-09 の resolver path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0031-task-0115 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
