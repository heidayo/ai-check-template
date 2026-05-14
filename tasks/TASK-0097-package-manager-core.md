# TASK-0097: Package manager core

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0097 |
| SPEC-ID   | SPEC-0026 |
| PLAN-ID   | PLAN-0026 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 45m |

## 責務

package manager detection / validation / script invocation rendering と install state compatibility を実装する。

## 入力

- `src/cli/profile-scripts.mjs`
- `src/cli/install-state.mjs`
- SPEC-0026 FR-01..FR-06

## 出力

- `src/cli/package-manager.mjs`
- Updated profile script resolver
- Updated install state persistence / validation

## File Scope（変更許可範囲）

- 変更: `src/cli/package-manager.mjs`
- 変更: `src/cli/profile-scripts.mjs`
- 変更: `src/cli/install-state.mjs`
- 削除: なし

## 禁止事項

- controller / docs / tests を変更しない
- dependency install を実行しない
- unknown package manager を silently accept しない
- old install state を壊さない
- `package-templates/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] supported package managers が validate される
- [x] target metadata / lockfile detection が存在する
- [x] profile scripts が package manager に応じて render される
- [x] install state が packageManager を保存し、missing field を pnpm default として扱う
- [x] TASK-0097 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| wrong detection | detector priority を修正 |
| invalid manager accepted | validator を修正 |
| old state rejected | install-state optional handling を修正 |

## Knowledge Management

package manager core regression が再発した場合、maintainer が target metadata, expected package manager, actual package manager を `sage/failures.md` に記録する。

## 段階採用

core helper を追加し、CLI integration は TASK-0098 に分離する。

## Done Definition

SPEC-0026 AC-03, AC-04, AC-05, AC-06 の core path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0026-task-0097 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
