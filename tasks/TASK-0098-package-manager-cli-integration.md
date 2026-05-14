# TASK-0098: Package manager CLI integration

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0098 |
| SPEC-ID   | SPEC-0026 |
| PLAN-ID   | PLAN-0026 |
| ステータス | Done |
| 担当Agent | Implementation+Test |
| 並列可否  | No |
| 依存TASK  | TASK-0097 |
| 見積     | 60m |

## 責務

`init` / `doctor` / `update` に `--package-manager` を統合し、CLI tests で explicit / detected / state-based behavior を固定する。

## 入力

- `src/cli/init.mjs`
- `src/cli/doctor.mjs`
- `src/cli/update.mjs`
- `src/cli/index.mjs`
- `tests/cli/*.test.mjs`

## 出力

- CLI option parsing and help updates
- Updated CLI tests

## File Scope（変更許可範囲）

- 変更: `src/cli/init.mjs`
- 変更: `src/cli/doctor.mjs`
- 変更: `src/cli/update.mjs`
- 変更: `src/cli/index.mjs`
- 変更: `tests/cli/init.test.mjs`
- 変更: `tests/cli/doctor.test.mjs`
- 変更: `tests/cli/update.test.mjs`
- 変更: `tests/cli/package.test.mjs`
- 削除: なし

## 禁止事項

- docs / SAGE status を変更しない
- dependency install を実行しない
- package templates を変更しない
- target write 前 validation を後回しにしない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] help に `--package-manager` が表示される
- [x] init explicit npm test が pass
- [x] yarn detection test が pass
- [x] doctor state-based package manager test が pass
- [x] update state-based repair test が pass
- [x] TASK-0098 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| help missing | usage text を修正 |
| doctor drift false positive | effective options を修正 |
| update repair mismatch | resolver call を修正 |
| invalid manager writes | parse validation order を修正 |

## Knowledge Management

CLI integration regression が再発した場合、maintainer が command, expected scripts, actual scripts を `sage/failures.md` に記録する。

## 段階採用

dependency install と shell script rewrite は対象外にし、package scripts generation に限定する。

## Done Definition

SPEC-0026 AC-01, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08 の CLI/test path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0026-task-0098 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
